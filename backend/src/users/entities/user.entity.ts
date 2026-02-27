import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserStatus, Region, Language } from '../../common/enums';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 20 })
    @Index()
    username: string;

    @Column({ unique: true })
    @Index()
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.PENDING_VERIFICATION,
    })
    @Index()
    status: UserStatus;

    @Column({
        type: 'enum',
        enum: Region,
    })
    region: Region;

    @Column({
        type: 'enum',
        enum: Language,
        default: Language.EN,
    })
    language: Language;

    // Optional profile fields
    @Column({ nullable: true, length: 255 })
    avatar_url: string;

    @Column({ nullable: true, length: 20 })
    pubg_nickname: string;

    @Column({ nullable: true, type: 'bigint' })
    pubg_id: string;

    @Column({ type: 'simple-array', nullable: true })
    roles: string[];

    @Column({ nullable: true, length: 50 })
    tier: string;

    @Column({ type: 'jsonb', nullable: true })
    play_schedule: Record<string, any>;

    @Column({ default: true })
    mic: boolean;

    @Column({ nullable: true, length: 280 })
    bio: string;

    @Column({ nullable: true, length: 37 })
    discord_username: string;

    @Column({ type: 'jsonb', nullable: true })
    social_links: Record<string, string>;

    // Admin field
    @Column({ default: false })
    @Index()
    is_admin: boolean;

    // Premium fields
    @Column({ default: false })
    @Index()
    is_premium: boolean;

    @Column({ nullable: true, type: 'timestamp' })
    @Index()
    premium_expires_at: Date;

    @Column({ nullable: true, length: 50 })
    premium_tier: string;

    // Reputation fields
    @Column({ default: 0 })
    reputation_score: number;

    @Column({ default: 0 })
    strike_count: number;

    @Column({ default: 0 })
    successful_matches: number;

    @Column({ default: 0 })
    total_applications: number;

    // Privacy
    @Column({ default: 'PUBLIC', length: 20 })
    profile_visibility: string;

    @Column({ default: false })
    show_email: boolean;

    // Email verification
    @Column({ default: false })
    email_verified: boolean;

    @Column({ nullable: true })
    @Exclude()
    email_verification_token: string;

    @Column({ nullable: true, type: 'timestamp' })
    email_verified_at: Date;

    // Password reset
    @Column({ nullable: true })
    @Exclude()
    password_reset_token: string;

    @Column({ nullable: true, type: 'timestamp' })
    password_reset_expires: Date;

    // Refresh token
    @Column({ nullable: true })
    @Exclude()
    refresh_token: string;

    // Account security
    @Column({ default: 0 })
    failed_login_attempts: number;

    @Column({ nullable: true, type: 'timestamp' })
    account_locked_until: Date;

    @Column({ nullable: true, type: 'timestamp' })
    last_login_at: Date;

    // Admin moderation fields
    @Column({ nullable: true, type: 'timestamp' })
    @Index()
    suspended_until: Date;

    @Column({ nullable: true, type: 'text' })
    suspended_reason: string;

    @Column({ nullable: true, type: 'timestamp' })
    @Index()
    banned_at: Date;

    @Column({ nullable: true, type: 'text' })
    banned_reason: string;

    @Column({ nullable: true, type: 'text' })
    admin_notes: string;

    @Column({ nullable: true, type: 'timestamp' })
    @Index()
    last_activity_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
