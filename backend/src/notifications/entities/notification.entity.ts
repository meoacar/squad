import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
    // Existing types
    APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
    APPLICATION_ACCEPTED = 'APPLICATION_ACCEPTED',
    APPLICATION_REJECTED = 'APPLICATION_REJECTED',
    POST_BOOSTED = 'POST_BOOSTED',
    PREMIUM_EXPIRING = 'PREMIUM_EXPIRING',
    POST_EXPIRING = 'POST_EXPIRING',

    // New social notification types
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    FOLLOW_REQUEST = 'FOLLOW_REQUEST',
    FOLLOW_REQUEST_ACCEPTED = 'FOLLOW_REQUEST_ACCEPTED',
    DIRECT_MESSAGE = 'DIRECT_MESSAGE',
    GROUP_MESSAGE = 'GROUP_MESSAGE',
    CLAN_INVITATION = 'CLAN_INVITATION',
    CLAN_ANNOUNCEMENT = 'CLAN_ANNOUNCEMENT',
    ACTIVITY_LIKED = 'ACTIVITY_LIKED',
    ACTIVITY_COMMENTED = 'ACTIVITY_COMMENTED',
    NEW_RATING = 'NEW_RATING',
    BADGE_EARNED = 'BADGE_EARNED',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({ type: 'jsonb' })
    payload: Record<string, any>;

    @Column({ type: 'timestamp', nullable: true })
    read_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
