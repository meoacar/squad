import {
    Entity,
    Column,
    CreateDateColumn,
    Index,
    PrimaryColumn,
} from 'typeorm';

@Entity('daily_stats')
export class DailyStat {
    @PrimaryColumn({ type: 'date' })
    date: Date;

    @Column({ type: 'integer', nullable: true })
    total_users: number;

    @Column({ type: 'integer', nullable: true })
    new_users: number;

    @Column({ type: 'integer', nullable: true })
    active_users: number;

    @Column({ type: 'integer', nullable: true })
    total_posts: number;

    @Column({ type: 'integer', nullable: true })
    new_posts: number;

    @Column({ type: 'integer', nullable: true })
    total_applications: number;

    @Column({ type: 'integer', nullable: true })
    new_applications: number;

    @Column({ type: 'integer', nullable: true })
    premium_users: number;

    @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
    revenue: number;

    @CreateDateColumn()
    @Index()
    created_at: Date;
}
