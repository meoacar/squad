import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(PushSubscription)
        private pushSubscriptionRepository: Repository<PushSubscription>,
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        private emailService: EmailService,
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

    /**
     * Create an in-app notification
     * This is always saved regardless of push notification success (graceful degradation)
     */
    async create(data: {
        user_id: string;
        type: NotificationType;
        payload: Record<string, any>;
    }): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user_id: data.user_id,
            type: data.type,
            payload: data.payload,
        });

        const saved = await this.notificationRepository.save(notification);

        // Try to send push notification, but don't fail if it doesn't work (graceful degradation)
        try {
            await this.sendPushNotificationForType(data.user_id, data.type, data.payload);
        } catch (error) {
            this.logger.error(
                `Failed to send push notification for ${data.type} to user ${data.user_id}:`,
                error,
            );
            // Continue - in-app notification is already saved
        }

        return saved;
    }

    /**
     * Create notification with email support
     * Checks user preferences before sending email
     */
    async createWithEmail(data: {
        user_id: string;
        user_email?: string;
        type: NotificationType;
        payload: Record<string, any>;
        notificationPreferences?: any;
    }): Promise<Notification> {
        // Create in-app notification (always saved)
        const notification = await this.create({
            user_id: data.user_id,
            type: data.type,
            payload: data.payload,
        });

        // Check if email should be sent based on user preferences
        if (data.user_email && data.notificationPreferences) {
            const shouldSendEmail = this.shouldSendEmailForType(
                data.type,
                data.notificationPreferences,
            );

            if (shouldSendEmail) {
                try {
                    const emailTemplate = this.emailService.getEmailTemplate(
                        data.type,
                        data.payload,
                    );

                    await this.emailService.sendEmail(
                        data.user_email,
                        emailTemplate.subject,
                        emailTemplate.html,
                        emailTemplate.text,
                    );

                    this.logger.log(
                        `Email notification sent to ${data.user_email} for type ${data.type}`,
                    );
                } catch (error) {
                    // Log error but don't fail - graceful degradation
                    this.logger.error(
                        `Failed to send email notification to ${data.user_email}:`,
                        error,
                    );
                }
            }
        }

        return notification;
    }

    /**
     * Check if email should be sent based on notification type and user preferences
     */
    private shouldSendEmailForType(
        type: NotificationType,
        preferences: any,
    ): boolean {
        switch (type) {
            case NotificationType.NEW_FOLLOWER:
            case NotificationType.FOLLOW_REQUEST:
            case NotificationType.FOLLOW_REQUEST_ACCEPTED:
                return preferences.email_follow ?? true;

            case NotificationType.DIRECT_MESSAGE:
            case NotificationType.GROUP_MESSAGE:
                return preferences.email_messages ?? true;

            case NotificationType.CLAN_INVITATION:
                return preferences.email_clan_invites ?? true;

            case NotificationType.CLAN_ANNOUNCEMENT:
                return preferences.email_clan_invites ?? true;

            case NotificationType.ACTIVITY_LIKED:
            case NotificationType.ACTIVITY_COMMENTED:
            case NotificationType.NEW_RATING:
            case NotificationType.BADGE_EARNED:
                return preferences.email_activity_interactions ?? true;

            default:
                // For other notification types, default to true
                return true;
        }
    }

    /**
     * Get user notifications with pagination
     */
    async getUserNotifications(
        userId: string,
        options?: { limit?: number; offset?: number; unreadOnly?: boolean },
    ): Promise<Notification[]> {
        const query = this.notificationRepository
            .createQueryBuilder('notification')
            .where('notification.user_id = :userId', { userId })
            .orderBy('notification.created_at', 'DESC');

        if (options?.unreadOnly) {
            query.andWhere('notification.read_at IS NULL');
        }

        if (options?.limit) {
            query.limit(options.limit);
        }

        if (options?.offset) {
            query.offset(options.offset);
        }

        return query.getMany();
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        await this.notificationRepository.update(
            { id: notificationId, user_id: userId },
            { read_at: new Date() },
        );
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update(
            { user_id: userId, read_at: IsNull() },
            { read_at: new Date() },
        );
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationRepository.count({
            where: { user_id: userId, read_at: IsNull() },
        });
    }

    /**
     * Send push notification based on notification type
     * Implements graceful degradation - failures are logged but don't throw
     */
    private async sendPushNotificationForType(
        userId: string,
        type: NotificationType,
        payload: Record<string, any>,
    ): Promise<void> {
        const notificationContent = this.getNotificationContent(type, payload);

        try {
            await this.sendToUser(userId, notificationContent);
        } catch (error) {
            // Log but don't throw - this is graceful degradation
            this.logger.warn(
                `Push notification failed for user ${userId}, type ${type}. In-app notification still available.`,
            );
            throw error; // Re-throw to be caught by caller
        }
    }

    /**
     * Get notification title and body based on type and payload
     */
    private getNotificationContent(
        type: NotificationType,
        payload: Record<string, any>,
    ): { title: string; body: string; url?: string } {
        switch (type) {
            case NotificationType.NEW_FOLLOWER:
                return {
                    title: 'Yeni Takipçi',
                    body: `${payload.follower_username || 'Bir kullanıcı'} sizi takip etmeye başladı`,
                    url: `/profile/${payload.follower_id}`,
                };

            case NotificationType.FOLLOW_REQUEST:
                return {
                    title: 'Takip İsteği',
                    body: `${payload.requester_username || 'Bir kullanıcı'} size takip isteği gönderdi`,
                    url: '/follow-requests',
                };

            case NotificationType.FOLLOW_REQUEST_ACCEPTED:
                return {
                    title: 'Takip İsteği Kabul Edildi',
                    body: `${payload.accepter_username || 'Kullanıcı'} takip isteğinizi kabul etti`,
                    url: `/profile/${payload.accepter_id}`,
                };

            case NotificationType.DIRECT_MESSAGE:
                return {
                    title: 'Yeni Mesaj',
                    body: `${payload.sender_username || 'Bir kullanıcı'} size mesaj gönderdi`,
                    url: `/messages/${payload.conversation_id}`,
                };

            case NotificationType.GROUP_MESSAGE:
                return {
                    title: 'Yeni Grup Mesajı',
                    body: `${payload.sender_username || 'Bir kullanıcı'} ${payload.clan_name || 'gruba'} mesaj gönderdi`,
                    url: `/clans/${payload.clan_id}/chat`,
                };

            case NotificationType.CLAN_INVITATION:
                return {
                    title: 'Clan Daveti',
                    body: `${payload.inviter_username || 'Bir kullanıcı'} sizi ${payload.clan_name || 'bir clan\'a'} davet etti`,
                    url: `/clans/${payload.clan_id}`,
                };

            case NotificationType.CLAN_ANNOUNCEMENT:
                return {
                    title: 'Clan Duyurusu',
                    body: `${payload.clan_name || 'Clan\'ınızda'} yeni bir duyuru var`,
                    url: `/clans/${payload.clan_id}`,
                };

            case NotificationType.ACTIVITY_LIKED:
                return {
                    title: 'Aktiviteniz Beğenildi',
                    body: `${payload.liker_username || 'Bir kullanıcı'} aktivitenizi beğendi`,
                    url: `/feed/${payload.activity_id}`,
                };

            case NotificationType.ACTIVITY_COMMENTED:
                return {
                    title: 'Yeni Yorum',
                    body: `${payload.commenter_username || 'Bir kullanıcı'} aktivitenize yorum yaptı`,
                    url: `/feed/${payload.activity_id}`,
                };

            case NotificationType.NEW_RATING:
                return {
                    title: 'Yeni Değerlendirme',
                    body: `${payload.rater_username || 'Bir kullanıcı'} sizi değerlendirdi: ${payload.rating || '?'} yıldız`,
                    url: '/profile/ratings',
                };

            case NotificationType.BADGE_EARNED:
                return {
                    title: 'Yeni Rozet Kazandınız!',
                    body: `${payload.badge_name || 'Bir rozet'} kazandınız`,
                    url: '/profile/badges',
                };

            // Existing notification types
            case NotificationType.APPLICATION_RECEIVED:
                return {
                    title: 'Yeni Başvuru',
                    body: `İlanınıza yeni bir başvuru geldi`,
                    url: `/applications/${payload.application_id}`,
                };

            case NotificationType.APPLICATION_ACCEPTED:
                return {
                    title: 'Başvuru Kabul Edildi',
                    body: `Başvurunuz kabul edildi`,
                    url: `/applications/${payload.application_id}`,
                };

            case NotificationType.APPLICATION_REJECTED:
                return {
                    title: 'Başvuru Reddedildi',
                    body: `Başvurunuz reddedildi`,
                    url: `/applications/${payload.application_id}`,
                };

            case NotificationType.POST_BOOSTED:
                return {
                    title: 'İlan Yükseltildi',
                    body: `İlanınız başarıyla yükseltildi`,
                    url: `/posts/${payload.post_id}`,
                };

            case NotificationType.PREMIUM_EXPIRING:
                return {
                    title: 'Premium Süresi Doluyor',
                    body: `Premium üyeliğiniz ${payload.days_remaining || '?'} gün içinde sona erecek`,
                    url: '/premium',
                };

            case NotificationType.POST_EXPIRING:
                return {
                    title: 'İlan Süresi Doluyor',
                    body: `İlanınız ${payload.hours_remaining || '?'} saat içinde sona erecek`,
                    url: `/posts/${payload.post_id}`,
                };

            default:
                return {
                    title: 'Bildirim',
                    body: 'Yeni bir bildiriminiz var',
                    url: '/notifications',
                };
        }
    }
}
