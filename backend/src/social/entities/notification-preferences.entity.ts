import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notification_preferences')
export class NotificationPreferences {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    user_id: string;

    @Column({ type: 'boolean', default: true })
    email_messages: boolean;

    @Column({ type: 'boolean', default: true })
    email_follow: boolean;

    @Column({ type: 'boolean', default: true })
    email_clan_invites: boolean;

    @Column({ type: 'boolean', default: true })
    email_activity_interactions: boolean;

    @Column({ type: 'boolean', default: true })
    push_messages: boolean;

    @Column({ type: 'boolean', default: true })
    push_follow: boolean;

    @Column({ type: 'boolean', default: true })
    push_clan_invites: boolean;

    @Column({ type: 'boolean', default: true })
    push_activity_interactions: boolean;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
