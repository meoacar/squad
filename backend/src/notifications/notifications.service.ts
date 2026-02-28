import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(PushSubscription)
        private pushSubscriptionRepository: Repository<PushSubscription>,
    ) {
        // VAPID keys'i yapılandır
        const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
        const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@squadbul.com';

        if (vapidPublicKey && vapidPrivateKey) {
            webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
            this.logger.log('VAPID keys configured successfully');
        } else {
            this.logger.warn('VAPID keys not configured. Push notifications will not work.');
        }
    }

    async saveSubscription(
        userId: string,
        subscribeDto: SubscribeDto,
    ): Promise<PushSubscription> {
        // Aynı endpoint varsa güncelle
        let subscription = await this.pushSubscriptionRepository.findOne({
            where: { userId, endpoint: subscribeDto.endpoint },
        });

        if (subscription) {
            subscription.p256dh = subscribeDto.keys.p256dh;
            subscription.auth = subscribeDto.keys.auth;
            subscription.isActive = true;
        } else {
            subscription = this.pushSubscriptionRepository.create({
                userId,
                endpoint: subscribeDto.endpoint,
                p256dh: subscribeDto.keys.p256dh,
                auth: subscribeDto.keys.auth,
            });
        }

        return this.pushSubscriptionRepository.save(subscription);
    }

    async removeSubscription(userId: string, endpoint: string): Promise<void> {
        await this.pushSubscriptionRepository.update(
            { userId, endpoint },
            { isActive: false },
        );
    }

    async sendNotification(
        dto: SendNotificationDto,
    ): Promise<{ successful: number; failed: number }> {
        let subscriptions: PushSubscription[];

        if (dto.userIds && dto.userIds.length > 0) {
            // Belirli kullanıcılara gönder
            subscriptions = await this.pushSubscriptionRepository.find({
                where: { userId: In(dto.userIds), isActive: true },
            });
        } else {
            // Tüm aktif abonelere gönder
            subscriptions = await this.pushSubscriptionRepository.find({
                where: { isActive: true },
            });
        }

        const payload = JSON.stringify({
            title: dto.title,
            body: dto.body,
            url: dto.url || '/',
            icon: dto.icon || '/icons/icon-192x192.png',
        });

        let successful = 0;
        let failed = 0;

        await Promise.all(
            subscriptions.map(async (subscription) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: subscription.endpoint,
                            keys: {
                                p256dh: subscription.p256dh,
                                auth: subscription.auth,
                            },
                        },
                        payload,
                    );
                    successful++;
                } catch (error) {
                    failed++;
                    this.logger.error(
                        `Failed to send notification to user ${subscription.userId}:`,
                        error,
                    );

                    // 410 Gone veya 404 Not Found durumunda aboneliği deaktif et
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await this.pushSubscriptionRepository.update(
                            { id: subscription.id },
                            { isActive: false },
                        );
                    }
                }
            }),
        );

        this.logger.log(
            `Notifications sent: ${successful} successful, ${failed} failed`,
        );

        return { successful, failed };
    }

    async sendToUser(
        userId: string,
        notification: { title: string; body: string; url?: string },
    ): Promise<void> {
        const subscriptions = await this.pushSubscriptionRepository.find({
            where: { userId, isActive: true },
        });

        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            url: notification.url || '/',
            icon: '/icons/icon-192x192.png',
        });

        await Promise.all(
            subscriptions.map(async (subscription) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: subscription.endpoint,
                            keys: {
                                p256dh: subscription.p256dh,
                                auth: subscription.auth,
                            },
                        },
                        payload,
                    );
                } catch (error) {
                    this.logger.error(
                        `Failed to send notification to user ${userId}:`,
                        error,
                    );

                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await this.pushSubscriptionRepository.update(
                            { id: subscription.id },
                            { isActive: false },
                        );
                    }
                }
            }),
        );
    }

    async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
        return this.pushSubscriptionRepository.find({
            where: { userId, isActive: true },
        });
    }
}

// In import eklenmelidir
import { In } from 'typeorm';
