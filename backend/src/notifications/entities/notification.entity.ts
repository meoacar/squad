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
    APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
    APPLICATION_ACCEPTED = 'APPLICATION_ACCEPTED',
    APPLICATION_REJECTED = 'APPLICATION_REJECTED',
    POST_BOOSTED = 'POST_BOOSTED',
    PREMIUM_EXPIRING = 'PREMIUM_EXPIRING',
    POST_EXPIRING = 'POST_EXPIRING',
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
