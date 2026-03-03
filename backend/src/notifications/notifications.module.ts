import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { PushSubscription } from './entities/push-subscription.entity';
import { Notification } from './entities/notification.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PushSubscription, Notification])],
    controllers: [NotificationsController],
    providers: [NotificationsService, EmailService],
    exports: [NotificationsService, EmailService],
})
export class NotificationsModule { }
