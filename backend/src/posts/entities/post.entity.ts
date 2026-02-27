import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Game } from '../../games/entities/game.entity';
import { PostType, PostStatus, GameMode, Region, Language } from '../../common/enums';

@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Game)
    @JoinColumn({ name: 'game_id' })
    game: Game;

    @Column({ name: 'game_id' })
    game_id: string;

    @Column({
        type: 'enum',
        enum: PostType,
    })
    @Index()
    type: PostType;

    @Column({ length: 80 })
    title: string;

    @Column({ length: 100, unique: true })
    @Index()
    slug: string;

    @Column({ length: 1500 })
    description: string;

    @Column({
        type: 'enum',
        enum: Region,
    })
    @Index()
    region: Region;

    @Column({
        type: 'enum',
        enum: GameMode,
    })
    @Index()
    mode: GameMode;

    @Column({
        type: 'enum',
        enum: Language,
    })
    @Index()
    language: Language;

    @Column({ type: 'simple-array', nullable: true })
    required_roles: string[];

    @Column({ nullable: true, length: 50 })
    tier_requirement: string;

    @Column({ nullable: true, length: 50 })
    min_tier: string;

    @Column({ nullable: true, length: 50 })
    max_tier: string;

    @Column({ nullable: true, type: 'int' })
    slots_available: number;

    @Column({ type: 'jsonb', nullable: true })
    requirements: Record<string, any>;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @Column({ name: 'created_by' })
    @Index()
    created_by: string;

    @Column({
        type: 'enum',
        enum: PostStatus,
        default: PostStatus.ACTIVE,
    })
    @Index()
    status: PostStatus;

    @Column({ default: 0 })
    view_count: number;

    @Column({ default: 0 })
    application_count: number;

    @CreateDateColumn()
    @Index()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'timestamp' })
    @Index()
    expires_at: Date;

    @Column({ default: false })
    @Index()
    is_boosted: boolean;

    @Column({ nullable: true, type: 'timestamp' })
    @Index()
    boost_expires_at: Date;

    @Column({ default: false })
    @Index()
    is_featured: boolean;

    @Column({ nullable: true, type: 'timestamp' })
    featured_until: Date;

    @Column({ nullable: true, type: 'timestamp' })
    last_bumped_at: Date;

    @Column({ nullable: true, type: 'timestamp' })
    @Index()
    deleted_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'deleted_by' })
    deletedBy: User;

    @Column({ nullable: true, name: 'deleted_by' })
    deleted_by: string;

    @Column({ nullable: true, type: 'text' })
    deletion_reason: string;

    @Column({ nullable: true, type: 'text' })
    admin_notes: string;
}
