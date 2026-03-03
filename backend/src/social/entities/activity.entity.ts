import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ActivityType {
    GAME_LISTING_CREATED = 'GAME_LISTING_CREATED',
    MATCH_COMPLETED = 'MATCH_COMPLETED',
    BADGE_EARNED = 'BADGE_EARNED',
    LEVEL_UP = 'LEVEL_UP',
    CLAN_JOINED = 'CLAN_JOINED',
    CLAN_CREATED = 'CLAN_CREATED',
    USER_FOLLOWED = 'USER_FOLLOWED',
    RATING_RECEIVED = 'RATING_RECEIVED',
    COMMENT_RECEIVED = 'COMMENT_RECEIVED',
    POST_LIKED = 'POST_LIKED',
}

@Entity('activities')
export class Activity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    user_id: string;

    @Column({
        type: 'varchar',
        length: 50,
    })
    @Index()
    type: ActivityType;

    @Column({ type: 'jsonb' })
    data: Record<string, any>;

    @Column({ type: 'integer', default: 0 })
    like_count: number;

    @Column({ type: 'integer', default: 0 })
    comment_count: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    @Index()
    created_at: Date;
}
