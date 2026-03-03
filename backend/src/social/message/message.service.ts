import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Message, MessageType, Conversation, MessageRead, ClanMember, ClanMemberRole } from '../entities';
import { User } from '../../users/entities/user.entity';
import { PaginationDto, PaginatedResult } from './dto';
import {
    ValidationException,
    NotFoundException,
    AuthorizationException,
} from '../exceptions';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrivacyService } from '../privacy/privacy.service';

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
        @InjectRepository(MessageRead)
        private messageReadRepository: Repository<MessageRead>,
        @InjectRepository(ClanMember)
        private clanMemberRepository: Repository<ClanMember>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private notificationsService: NotificationsService,
        @Inject(forwardRef(() => PrivacyService))
        private privacyService: PrivacyService,
    ) { }

    /**
     * Send a direct message
     * Requirements: 3.1, 3.2, 3.5
     */
    async sendDirectMessage(
        senderId: string,
        recipientId: string,
        content: string,
    ): Promise<Message> {
        // Validate message length
        if (content.length > 2000) {
            throw new ValidationException('Message content exceeds 2000 characters');
        }

        // Check if users exist
        const [sender, recipient] = await Promise.all([
            this.userRepository.findOne({ where: { id: senderId } }),
            this.userRepository.findOne({ where: { id: recipientId } }),
        ]);

        if (!sender) {
            throw new NotFoundException('User', senderId);
        }
        if (!recipient) {
            throw new NotFoundException('User', recipientId);
        }

        // Check if blocked (Requirement 3.4)
        const isBlocked = await this.privacyService.isBlocked(senderId, recipientId);
        if (isBlocked) {
            throw new AuthorizationException('Cannot send message to blocked user');
        }

        // Find or create conversation
        const conversation = await this.findOrCreateConversation([senderId, recipientId]);

        // Create message
        const message = this.messageRepository.create({
            sender_id: senderId,
            content,
            message_type: MessageType.DIRECT,
            conversation_id: conversation.id,
        });

        const savedMessage = await this.messageRepository.save(message);

        // Update conversation last message
        await this.conversationRepository.update(conversation.id, {
            last_message_id: savedMessage.id,
            last_message_at: savedMessage.created_at,
        });

        // Send notification to recipient
        try {
            await this.notificationsService.sendToUser(recipientId, {
                title: 'New Message',
                body: `${sender.username}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                url: `/messages/${conversation.id}`,
            });
        } catch (error) {
            this.logger.error('Failed to send message notification', error);
            // Don't fail the request if notification fails
        }

        return savedMessage;
    }

    /**
     * Get direct messages between two users
     * Requirements: 3.3
     */
    async getDirectMessages(
        userId: string,
        otherUserId: string,
        pagination: PaginationDto,
    ): Promise<PaginatedResult<Message>> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        // Find conversation
        const conversation = await this.conversationRepository
            .createQueryBuilder('conversation')
            .where(':userId = ANY(conversation.participant_ids)', { userId })
            .andWhere(':otherUserId = ANY(conversation.participant_ids)', { otherUserId })
            .getOne();

        if (!conversation) {
            return {
                data: [],
                total: 0,
                page,
                limit,
                totalPages: 0,
            };
        }

        // Get messages
        const [messages, total] = await this.messageRepository.findAndCount({
            where: {
                conversation_id: conversation.id,
                deleted_at: IsNull(),
            },
            relations: ['sender'],
            skip,
            take: limit,
            order: { created_at: 'DESC' },
        });

        return {
            data: messages,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get all conversations for a user
     * Requirements: 3.3
     */
    async getConversations(userId: string): Promise<Conversation[]> {
        const conversations = await this.conversationRepository
            .createQueryBuilder('conversation')
            .where(':userId = ANY(conversation.participant_ids)', { userId })
            .orderBy('conversation.last_message_at', 'DESC', 'NULLS LAST')
            .getMany();

        return conversations;
    }

    /**
     * Send a group message
     * Requirements: 4.1, 4.2, 4.5
     */
    async sendGroupMessage(
        senderId: string,
        groupId: string,
        content: string,
    ): Promise<Message> {
        // Validate message length
        if (content.length > 2000) {
            throw new ValidationException('Message content exceeds 2000 characters');
        }

        // Check if user is a member of the clan
        const membership = await this.clanMemberRepository.findOne({
            where: {
                clan_id: groupId,
                user_id: senderId,
            },
        });

        if (!membership) {
            throw new AuthorizationException('You are not a member of this clan');
        }

        // Get sender info
        const sender = await this.userRepository.findOne({
            where: { id: senderId },
        });

        if (!sender) {
            throw new NotFoundException('User', senderId);
        }

        // Create message
        const message = this.messageRepository.create({
            sender_id: senderId,
            content,
            message_type: MessageType.GROUP,
            group_id: groupId,
        });

        const savedMessage = await this.messageRepository.save(message);

        // Get all clan members except sender
        const members = await this.clanMemberRepository.find({
            where: {
                clan_id: groupId,
            },
        });

        // Send notifications to all members except sender
        const notificationPromises = members
            .filter((member) => member.user_id !== senderId)
            .map((member) =>
                this.notificationsService.sendToUser(member.user_id, {
                    title: 'New Group Message',
                    body: `${sender.username}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                    url: `/clans/${groupId}/chat`,
                }).catch((error) => {
                    this.logger.error('Failed to send group message notification', error);
                })
            );

        await Promise.allSettled(notificationPromises);

        return savedMessage;
    }

    /**
     * Get group messages
     * Requirements: 4.1
     */
    async getGroupMessages(
        groupId: string,
        userId: string,
        pagination: PaginationDto,
    ): Promise<PaginatedResult<Message>> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        // Check if user is a member of the clan
        const membership = await this.clanMemberRepository.findOne({
            where: {
                clan_id: groupId,
                user_id: userId,
            },
        });

        if (!membership) {
            throw new AuthorizationException('You are not a member of this clan');
        }

        // Get messages
        const [messages, total] = await this.messageRepository.findAndCount({
            where: {
                group_id: groupId,
                deleted_at: IsNull(),
            },
            relations: ['sender'],
            skip,
            take: limit,
            order: { created_at: 'DESC' },
        });

        return {
            data: messages,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Delete a group message (admin only)
     * Requirements: 4.6
     */
    async deleteGroupMessage(messageId: string, userId: string): Promise<void> {
        // Get message
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message', messageId);
        }

        if (message.message_type !== MessageType.GROUP) {
            throw new ValidationException('Can only delete group messages');
        }

        // Check if user is admin of the clan
        const membership = await this.clanMemberRepository.findOne({
            where: {
                clan_id: message.group_id,
                user_id: userId,
            },
        });

        if (!membership || membership.role === ClanMemberRole.MEMBER) {
            throw new AuthorizationException('Only clan moderators and above can delete messages');
        }

        // Soft delete the message
        await this.messageRepository.update(messageId, {
            deleted_at: new Date(),
        });
    }

    /**
     * Mark a message as read
     * Requirements: 13.3, 13.4
     */
    async markAsRead(messageId: string, userId: string): Promise<void> {
        // Check if message exists
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message', messageId);
        }

        // Check if already marked as read
        const existingRead = await this.messageReadRepository.findOne({
            where: {
                message_id: messageId,
                user_id: userId,
            },
        });

        if (existingRead) {
            return; // Already marked as read
        }

        // Create read record
        const messageRead = this.messageReadRepository.create({
            message_id: messageId,
            user_id: userId,
        });

        await this.messageReadRepository.save(messageRead);
    }

    /**
     * Get unread message count for a user
     * Requirements: 13.3
     */
    async getUnreadCount(userId: string): Promise<number> {
        // Get all conversations for the user
        const conversations = await this.conversationRepository
            .createQueryBuilder('conversation')
            .where(':userId = ANY(conversation.participant_ids)', { userId })
            .getMany();

        const conversationIds = conversations.map((c) => c.id);

        if (conversationIds.length === 0) {
            return 0;
        }

        // Get all messages in these conversations
        const messages = await this.messageRepository.find({
            where: {
                conversation_id: In(conversationIds),
                deleted_at: IsNull(),
            },
            select: ['id', 'sender_id'],
        });

        // Filter messages not sent by the user
        const receivedMessageIds = messages
            .filter((m) => m.sender_id !== userId)
            .map((m) => m.id);

        if (receivedMessageIds.length === 0) {
            return 0;
        }

        // Get read messages
        const readMessages = await this.messageReadRepository.find({
            where: {
                message_id: In(receivedMessageIds),
                user_id: userId,
            },
            select: ['message_id'],
        });

        const readMessageIds = new Set(readMessages.map((r) => r.message_id));

        // Count unread messages
        const unreadCount = receivedMessageIds.filter(
            (id) => !readMessageIds.has(id)
        ).length;

        return unreadCount;
    }

    /**
     * Find or create a conversation between users
     * Private helper method
     */
    private async findOrCreateConversation(participantIds: string[]): Promise<Conversation> {
        // Sort participant IDs for consistent lookup
        const sortedIds = [...participantIds].sort();

        // Try to find existing conversation
        const existingConversation = await this.conversationRepository
            .createQueryBuilder('conversation')
            .where('conversation.participant_ids @> :ids', { ids: sortedIds })
            .andWhere('conversation.participant_ids <@ :ids', { ids: sortedIds })
            .getOne();

        if (existingConversation) {
            return existingConversation;
        }

        // Create new conversation
        const conversation = this.conversationRepository.create({
            participant_ids: sortedIds,
        });

        return this.conversationRepository.save(conversation);
    }
}
