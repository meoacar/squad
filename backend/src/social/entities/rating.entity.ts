import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
    Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Min, Max, MaxLength, IsOptional } from 'class-validator';

@Entity('ratings')
@Unique(['rater_id', 'rated_user_id', 'match_id'])
@Check('"rater_id" != "rated_user_id"')
@Check('"rating" >= 1 AND "rating" <= 5')
@Check('"comment" IS NULL OR LENGTH("comment") <= 500')
export class Rating {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    rater_id: string;

    @Column({ type: 'uuid' })
    @Index()
    rated_user_id: string;

    @Column({ type: 'uuid' })
    @Index()
    match_id: string;

    @Column({ type: 'integer' })
    @Min(1)
    @Max(5)
    rating: number;

    @Column({ type: 'text', nullable: true })
    @IsOptional()
    @MaxLength(500)
    comment: string;

    @Column({ type: 'boolean', default: false })
    @Index()
    is_hidden: boolean;

    @Column({ type: 'integer', default: 0 })
    flag_count: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rater_id' })
    rater: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rated_user_id' })
    rated_user: User;

    @CreateDateColumn()
    @Index()
    created_at: Date;
}
