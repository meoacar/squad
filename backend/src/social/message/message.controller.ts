import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { Request } from 'express';
import { MessageService } from './message.service';
import { SendDirectMessageDto, SendGroupMessageDto, PaginationDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SocialThrottlerGuard } from '../guards/social-throttler.guard';
import { MessageRateLimit } from '../decorators/rate-limit.decorator';

interface AuthRequest extends Request {
    user: {
        id: string;
        username: string;
    };
}

@Controller('messages')
@UseGuards(JwtAuthGuard, SocialThrottlerGuard)
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    /**
     * Send a direct message
     * POST /messages/direct
     */
    @Post('direct')
    @MessageRateLimit()
    async sendDirectMessage(
        @Req() req: AuthRequest,
        @Body() dto: SendDirectMessageDto,
    ) {
        const message = await this.messageService.sendDirectMessage(
            req.user.id,
            dto.recipient_id,
            dto.content,
        );

        return {
            success: true,
            data: message,
        };
    }

    /**
     * Get direct messages with another user
     * GET /messages/direct/:userId
     */
    @Get('direct/:userId')
    async getDirectMessages(
        @Req() req: AuthRequest,
        @Param('userId') userId: string,
        @Query() pagination: PaginationDto,
    ) {
        const result = await this.messageService.getDirectMessages(
            req.user.id,
            userId,
            pagination,
        );

        return {
            success: true,
            ...result,
        };
    }

    /**
     * Get all conversations
     * GET /messages/conversations
     */
    @Get('conversations')
    async getConversations(@Req() req: AuthRequest) {
        const conversations = await this.messageService.getConversations(req.user.id);

        return {
            success: true,
            data: conversations,
        };
    }

    /**
     * Send a group message
     * POST /messages/group
     */
    @Post('group')
    @MessageRateLimit()
    async sendGroupMessage(
        @Req() req: AuthRequest,
        @Body() dto: SendGroupMessageDto,
    ) {
        const message = await this.messageService.sendGroupMessage(
            req.user.id,
            dto.group_id,
            dto.content,
        );

        return {
            success: true,
            data: message,
        };
    }

    /**
     * Get group messages
     * GET /messages/group/:groupId
     */
    @Get('group/:groupId')
    async getGroupMessages(
        @Req() req: AuthRequest,
        @Param('groupId') groupId: string,
        @Query() pagination: PaginationDto,
    ) {
        const result = await this.messageService.getGroupMessages(
            groupId,
            req.user.id,
            pagination,
        );

        return {
            success: true,
            ...result,
        };
    }

    /**
     * Delete a group message (admin only)
     * DELETE /messages/group/:messageId
     */
    @Delete('group/:messageId')
    async deleteGroupMessage(
        @Req() req: AuthRequest,
        @Param('messageId') messageId: string,
    ) {
        await this.messageService.deleteGroupMessage(messageId, req.user.id);

        return {
            success: true,
            message: 'Message deleted successfully',
        };
    }

    /**
     * Mark a message as read
     * POST /messages/:messageId/read
     */
    @Post(':messageId/read')
    async markAsRead(
        @Req() req: AuthRequest,
        @Param('messageId') messageId: string,
    ) {
        await this.messageService.markAsRead(messageId, req.user.id);

        return {
            success: true,
            message: 'Message marked as read',
        };
    }

    /**
     * Get unread message count
     * GET /messages/unread/count
     */
    @Get('unread/count')
    async getUnreadCount(@Req() req: AuthRequest) {
        const count = await this.messageService.getUnreadCount(req.user.id);

        return {
            success: true,
            data: { count },
        };
    }
}
