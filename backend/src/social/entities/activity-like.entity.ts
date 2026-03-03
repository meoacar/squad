import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Activity } from './activity.entity';

@Entity('activity_likes')
@Unique(['activity_id', 'user_id'])
export class ActivityLike {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    activity_id: string;

    @Column({ type: 'uuid' })
    @Index()
    user_id: string;

    @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'activity_id' })
    activity: Activity;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    created_at: Date;
}
