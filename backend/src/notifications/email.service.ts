import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from './entities/notification.entity';

export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    /**
     * Send email notification
     * This is a placeholder implementation that logs emails
     * In production, integrate with SendGrid, AWS SES, or similar service
     */
    async sendEmail(
        to: string,
        subject: string,
        html: string,
        text: string,
    ): Promise<void> {
        // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
        // For now, just log the email
        this.logger.log(`[EMAIL] To: ${to}`);
        this.logger.log(`[EMAIL] Subject: ${subject}`);
        this.logger.log(`[EMAIL] Text: ${text}`);

        // In production, uncomment and configure:
        // await this.mailerService.sendMail({
        //     to,
        //     subject,
        //     html,
        //     text,
        // });
    }

    /**
     * Get email template for notification type
     */
    getEmailTemplate(
        type: NotificationType,
        payload: Record<string, any>,
    ): EmailTemplate {
        switch (type) {
            case NotificationType.NEW_FOLLOWER:
                return {
                    subject: 'Yeni Takipçi - SquadBul',
                    html: this.getFollowerEmailHtml(payload),
                    text: `${payload.follower_username || 'Bir kullanıcı'} sizi takip etmeye başladı. Profilini görüntülemek için SquadBul'a giriş yapın.`,
                };

            case NotificationType.FOLLOW_REQUEST:
                return {
                    subject: 'Yeni Takip İsteği - SquadBul',
                    html: this.getFollowRequestEmailHtml(payload),
                    text: `${payload.requester_username || 'Bir kullanıcı'} size takip isteği gönderdi. İsteği onaylamak veya reddetmek için SquadBul'a giriş yapın.`,
                };

            case NotificationType.FOLLOW_REQUEST_ACCEPTED:
                return {
                    subject: 'Takip İsteğiniz Kabul Edildi - SquadBul',
                    html: this.getFollowRequestAcceptedEmailHtml(payload),
                    text: `${payload.accepter_username || 'Kullanıcı'} takip isteğinizi kabul etti. Artık aktivitelerini görebilirsiniz.`,
                };

            case NotificationType.DIRECT_MESSAGE:
                return {
                    subject: 'Yeni Mesaj - SquadBul',
                    html: this.getDirectMessageEmailHtml(payload),
                    text: `${payload.sender_username || 'Bir kullanıcı'} size mesaj gönderdi. Mesajı okumak için SquadBul'a giriş yapın.`,
                };

            case NotificationType.GROUP_MESSAGE:
                return {
                    subject: `Yeni Grup Mesajı - ${payload.clan_name || 'Clan'} - SquadBul`,
                    html: this.getGroupMessageEmailHtml(payload),
                    text: `${payload.sender_username || 'Bir kullanıcı'} ${payload.clan_name || 'gruba'} mesaj gönderdi. Mesajı okumak için SquadBul'a giriş yapın.`,
                };

            case NotificationType.CLAN_INVITATION:
                return {
                    subject: `Clan Daveti - ${payload.clan_name || 'Clan'} - SquadBul`,
                    html: this.getClanInvitationEmailHtml(payload),
                    text: `${payload.inviter_username || 'Bir kullanıcı'} sizi ${payload.clan_name || 'bir clan\'a'} davet etti. Daveti kabul etmek veya reddetmek için SquadBul'a giriş yapın.`,
                };

            case NotificationType.CLAN_ANNOUNCEMENT:
                return {
                    subject: `Yeni Duyuru - ${payload.clan_name || 'Clan'} - SquadBul`,
                    html: this.getClanAnnouncementEmailHtml(payload),
                    text: `${payload.clan_name || 'Clan\'ınızda'} yeni bir duyuru var. Duyuruyu okumak için SquadBul'a giriş yapın.`,
                };

            case NotificationType.ACTIVITY_LIKED:
                return {
                    subject: 'Aktiviteniz Beğenildi - SquadBul',
                    html: this.getActivityLikedEmailHtml(payload),
                    text: `${payload.liker_username || 'Bir kullanıcı'} aktivitenizi beğendi.`,
                };

            case NotificationType.ACTIVITY_COMMENTED:
                return {
                    subject: 'Aktivitenize Yorum Yapıldı - SquadBul',
                    html: this.getActivityCommentedEmailHtml(payload),
                    text: `${payload.commenter_username || 'Bir kullanıcı'} aktivitenize yorum yaptı: "${payload.comment_preview || ''}"`,
                };

            case NotificationType.NEW_RATING:
                return {
                    subject: 'Yeni Değerlendirme - SquadBul',
                    html: this.getNewRatingEmailHtml(payload),
                    text: `${payload.rater_username || 'Bir kullanıcı'} sizi değerlendirdi: ${payload.rating || '?'} yıldız${payload.comment ? '. Yorum: ' + payload.comment : ''}`,
                };

            case NotificationType.BADGE_EARNED:
                return {
                    subject: 'Yeni Rozet Kazandınız! - SquadBul',
                    html: this.getBadgeEarnedEmailHtml(payload),
                    text: `Tebrikler! ${payload.badge_name || 'Bir rozet'} kazandınız.`,
                };

            default:
                return {
                    subject: 'Yeni Bildirim - SquadBul',
                    html: this.getDefaultEmailHtml(),
                    text: 'SquadBul\'da yeni bir bildiriminiz var.',
                };
        }
    }

    // HTML Email Templates
    private getFollowerEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Yeni Takipçi</h2>
                <p><strong>${payload.follower_username || 'Bir kullanıcı'}</strong> sizi takip etmeye başladı.</p>
                <p><a href="${process.env.FRONTEND_URL}/profile/${payload.follower_id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Profili Görüntüle</a></p>
            </div>
        `;
    }

    private getFollowRequestEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Yeni Takip İsteği</h2>
                <p><strong>${payload.requester_username || 'Bir kullanıcı'}</strong> size takip isteği gönderdi.</p>
                <p><a href="${process.env.FRONTEND_URL}/follow-requests" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">İstekleri Görüntüle</a></p>
            </div>
        `;
    }

    private getFollowRequestAcceptedEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Takip İsteğiniz Kabul Edildi</h2>
                <p><strong>${payload.accepter_username || 'Kullanıcı'}</strong> takip isteğinizi kabul etti.</p>
                <p><a href="${process.env.FRONTEND_URL}/profile/${payload.accepter_id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Profili Görüntüle</a></p>
            </div>
        `;
    }

    private getDirectMessageEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Yeni Mesaj</h2>
                <p><strong>${payload.sender_username || 'Bir kullanıcı'}</strong> size mesaj gönderdi.</p>
                <p><a href="${process.env.FRONTEND_URL}/messages/${payload.conversation_id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Mesajı Oku</a></p>
            </div>
        `;
    }

    private getGroupMessageEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Yeni Grup Mesajı</h2>
                <p><strong>${payload.sender_username || 'Bir kullanıcı'}</strong> <strong>${payload.clan_name || 'gruba'}</strong> mesaj gönderdi.</p>
                <p><a href="${process.env.FRONTEND_URL}/clans/${payload.clan_id}/chat" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Mesajı Oku</a></p>
            </div>
        `;
    }

    private getClanInvitationEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Clan Daveti</h2>
                <p><strong>${payload.inviter_username || 'Bir kullanıcı'}</strong> sizi <strong>${payload.clan_name || 'bir clan\'a'}</strong> davet etti.</p>
                <p><a href="${process.env.FRONTEND_URL}/clans/${payload.clan_id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Daveti Görüntüle</a></p>
            </div>
        `;
    }

    private getClanAnnouncementEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Yeni Clan Duyurusu</h2>
                <p><strong>${payload.clan_name || 'Clan\'ınızda'}</strong> yeni bir duyuru var.</p>
                ${payload.announcement_preview ? `<p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${payload.announcement_preview}</p>` : ''}
                <p><a href="${process.env.FRONTEND_URL}/clans/${payload.clan_id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Duyuruyu Oku</a></p>
            </div>
        `;
    }

    private getActivityLikedEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Aktiviteniz Beğenildi</h2>
                <p><strong>${payload.liker_username || 'Bir kullanıcı'}</strong> aktivitenizi beğendi.</p>
                <p><a href="${process.env.FRONTEND_URL}/feed/${payload.activity_id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aktiviteyi Görüntüle</a></p>
            </div>
        `;
    }

    private getActivityCommentedEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Yeni Yorum</h2>
                <p><strong>${payload.commenter_username || 'Bir kullanıcı'}</strong> aktivitenize yorum yaptı:</p>
                ${payload.comment_preview ? `<p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">"${payload.comment_preview}"</p>` : ''}
                <p><a href="${process.env.FRONTEND_URL}/feed/${payload.activity_id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Yorumu Görüntüle</a></p>
            </div>
        `;
    }

    private getNewRatingEmailHtml(payload: Record<string, any>): string {
        const stars = '⭐'.repeat(payload.rating || 0);
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Yeni Değerlendirme</h2>
                <p><strong>${payload.rater_username || 'Bir kullanıcı'}</strong> sizi değerlendirdi:</p>
                <p style="font-size: 24px;">${stars} (${payload.rating || '?'}/5)</p>
                ${payload.comment ? `<p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">"${payload.comment}"</p>` : ''}
                <p><a href="${process.env.FRONTEND_URL}/profile/ratings" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Değerlendirmeleri Görüntüle</a></p>
            </div>
        `;
    }

    private getBadgeEarnedEmailHtml(payload: Record<string, any>): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>🎉 Tebrikler!</h2>
                <p>Yeni bir rozet kazandınız: <strong>${payload.badge_name || 'Rozet'}</strong></p>
                ${payload.badge_description ? `<p>${payload.badge_description}</p>` : ''}
                <p><a href="${process.env.FRONTEND_URL}/profile/badges" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rozetlerinizi Görüntüle</a></p>
            </div>
        `;
    }

    private getDefaultEmailHtml(): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Yeni Bildirim</h2>
                <p>SquadBul'da yeni bir bildiriminiz var.</p>
                <p><a href="${process.env.FRONTEND_URL}/notifications" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Bildirimleri Görüntüle</a></p>
            </div>
        `;
    }
}
