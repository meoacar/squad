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
import { Rating } from './rating.entity';

@Entity('rating_reports')
@Unique(['rating_id', 'reporter_id'])
export class RatingReport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    rating_id: string;

    @Column({ type: 'uuid' })
    reporter_id: string;

    @Column({ type: 'text' })
    reason: string;

    @ManyToOne(() => Rating, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rating_id' })
    rating: Rating;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reporter_id' })
    reporter: User;

    @CreateDateColumn()
    created_at: Date;
}
