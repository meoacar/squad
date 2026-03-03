import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket Gateway for real-time messaging
 * Requirements: 3.2, 4.5
 */
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/messages',
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MessageGateway.name);
    private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

    constructor(
        private messageService: MessageService,
        private jwtService: JwtService,
    ) { }

    /**
     * Handle client connection
     * Authenticate the user and store their socket connection
     */
    async handleConnection(client: Socket) {
        try {
            // Extract token from handshake
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                this.logger.warn(`Client ${client.id} attempted to connect without token`);
                client.disconnect();
                return;
            }

            // Verify token
            const payload = await this.jwtService.verifyAsync(token);
            const userId = payload.sub || payload.id;

            if (!userId) {
                this.logger.warn(`Client ${client.id} has invalid token payload`);
                client.disconnect();
                return;
            }

            // Store user ID in socket data
            client.data.userId = userId;

            // Track user's socket connections
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            const userSocketSet = this.userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.add(client.id);
            }

            this.logger.log(`User ${userId} connected with socket ${client.id}`);

            // Join user to their personal room
            client.join(`user:${userId}`);

            // Notify client of successful connection
            client.emit('connected', { userId });
        } catch (error) {
            this.logger.error(`Connection error for client ${client.id}:`, error);
            client.disconnect();
        }
    }

    /**
     * Handle client disconnection
     */
    handleDisconnect(client: Socket) {
        const userId = client.data.userId;

        if (userId) {
            // Remove socket from user's connections
            const userSocketSet = this.userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(client.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(userId);
                }
            }

            this.logger.log(`User ${userId} disconnected socket ${client.id}`);
        }
    }

    /**
     * Handle direct message sending
     */
    @SubscribeMessage('sendDirectMessage')
    async handleDirectMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { recipientId: string; content: string },
    ) {
        try {
            const senderId = client.data.userId;

            if (!senderId) {
                return { error: 'Unauthorized' };
            }

            // Send message through service
            const message = await this.messageService.sendDirectMessage(
                senderId,
                data.recipientId,
                data.content,
            );

            // Emit to sender (confirmation)
            client.emit('messageSent', message);

            // Emit to recipient if they're online
            this.server.to(`user:${data.recipientId}`).emit('newMessage', message);

            return { success: true, message };
        } catch (error) {
            this.logger.error('Error sending direct message:', error);
            return { error: error.message };
        }
    }

    /**
     * Handle group message sending
     */
    @SubscribeMessage('sendGroupMessage')
    async handleGroupMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupId: string; content: string },
    ) {
        try {
            const senderId = client.data.userId;

            if (!senderId) {
                return { error: 'Unauthorized' };
            }

            // Send message through service
            const message = await this.messageService.sendGroupMessage(
                senderId,
                data.groupId,
                data.content,
            );

            // Emit to sender (confirmation)
            client.emit('messageSent', message);

            // Emit to all members in the group
            this.server.to(`group:${data.groupId}`).emit('newGroupMessage', message);

            return { success: true, message };
        } catch (error) {
            this.logger.error('Error sending group message:', error);
            return { error: error.message };
        }
    }

    /**
     * Join a group chat room
     */
    @SubscribeMessage('joinGroup')
    async handleJoinGroup(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupId: string },
    ) {
        try {
            const userId = client.data.userId;

            if (!userId) {
                return { error: 'Unauthorized' };
            }

            // Join the group room
            client.join(`group:${data.groupId}`);

            this.logger.log(`User ${userId} joined group ${data.groupId}`);

            return { success: true };
        } catch (error) {
            this.logger.error('Error joining group:', error);
            return { error: error.message };
        }
    }

    /**
     * Leave a group chat room
     */
    @SubscribeMessage('leaveGroup')
    async handleLeaveGroup(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupId: string },
    ) {
        try {
            const userId = client.data.userId;

            if (!userId) {
                return { error: 'Unauthorized' };
            }

            // Leave the group room
            client.leave(`group:${data.groupId}`);

            this.logger.log(`User ${userId} left group ${data.groupId}`);

            return { success: true };
        } catch (error) {
            this.logger.error('Error leaving group:', error);
            return { error: error.message };
        }
    }

    /**
     * Mark message as read
     */
    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: string },
    ) {
        try {
            const userId = client.data.userId;

            if (!userId) {
                return { error: 'Unauthorized' };
            }

            await this.messageService.markAsRead(data.messageId, userId);

            return { success: true };
        } catch (error) {
            this.logger.error('Error marking message as read:', error);
            return { error: error.message };
        }
    }

    /**
     * Typing indicator for direct messages
     */
    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { recipientId: string; isTyping: boolean },
    ) {
        const userId = client.data.userId;

        if (!userId) {
            return { error: 'Unauthorized' };
        }

        // Emit typing status to recipient
        this.server.to(`user:${data.recipientId}`).emit('userTyping', {
            userId,
            isTyping: data.isTyping,
        });

        return { success: true };
    }

    /**
     * Typing indicator for group messages
     */
    @SubscribeMessage('groupTyping')
    handleGroupTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupId: string; isTyping: boolean },
    ) {
        const userId = client.data.userId;

        if (!userId) {
            return { error: 'Unauthorized' };
        }

        // Emit typing status to group
        this.server.to(`group:${data.groupId}`).emit('userGroupTyping', {
            userId,
            isTyping: data.isTyping,
        });

        return { success: true };
    }

    /**
     * Check if a user is online
     */
    isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId);
    }

    /**
     * Get online users count
     */
    getOnlineUsersCount(): number {
        return this.userSockets.size;
    }

    /**
     * Send a message to a specific user (used by service layer)
     */
    sendToUser(userId: string, event: string, data: any): void {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Send a message to a group (used by service layer)
     */
    sendToGroup(groupId: string, event: string, data: any): void {
        this.server.to(`group:${groupId}`).emit(event, data);
    }
}
