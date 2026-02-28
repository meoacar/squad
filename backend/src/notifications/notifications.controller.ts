import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    Delete,
    Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('subscribe')
    @UseGuards(JwtAuthGuard)
    async subscribe(@Request() req: any, @Body() subscribeDto: SubscribeDto) {
        const userId = req.user.userId;
        await this.notificationsService.saveSubscription(userId, subscribeDto);
        return { success: true, message: 'Bildirim aboneliği oluşturuldu' };
    }

    @Delete('unsubscribe/:endpoint')
    @UseGuards(JwtAuthGuard)
    async unsubscribe(@Request() req: any, @Param('endpoint') endpoint: string) {
        const userId = req.user.userId;
        await this.notificationsService.removeSubscription(userId, endpoint);
        return { success: true, message: 'Bildirim aboneliği kaldırıldı' };
    }

    @Post('send')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
        const result = await this.notificationsService.sendNotification(
            sendNotificationDto,
        );
        return {
            success: true,
            message: 'Bildirimler gönderildi',
            sent: result.successful,
            failed: result.failed,
        };
    }

    @Post('test')
    @UseGuards(JwtAuthGuard)
    async testNotification(@Request() req: any) {
        const userId = req.user.userId;
        await this.notificationsService.sendToUser(userId, {
            title: 'Test Bildirimi',
            body: 'Bu bir test bildirimidir',
            url: '/',
        });
        return { success: true, message: 'Test bildirimi gönderildi' };
    }
}
