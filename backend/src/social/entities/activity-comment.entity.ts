import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Activity } from './activity.entity';
import { MaxLength } from 'class-validator';

@Entity('activity_comments')
@Check('LENGTH("content") <= 500')
export class ActivityComment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    activity_id: string;

    @Column({ type: 'uuid' })
    @Index()
    user_id: string;

    @Column({ type: 'text' })
    @MaxLength(500)
    content: string;

    @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'activity_id' })
    activity: Activity;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    @Index()
    created_at: Date;
}
