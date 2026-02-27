import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

interface CreateNotificationDto {
    user_id: string;
    type: NotificationType;
    payload: Record<string, any>;
}

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }

    async create(dto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationRepository.create(dto);
        return await this.notificationRepository.save(notification);
    }

    async getUserNotifications(userId: string): Promise<Notification[]> {
        return await this.notificationRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return await this.notificationRepository.count({
            where: {
                user_id: userId,
                read_at: IsNull(),
            },
        });
    }

    async markAsRead(notificationId: string, userId: string): Promise<void> {
        await this.notificationRepository.update(
            {
                id: notificationId,
                user_id: userId,
            },
            {
                read_at: new Date(),
            },
        );
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update(
            {
                user_id: userId,
                read_at: IsNull(),
            },
            {
                read_at: new Date(),
            },
        );
    }
}
