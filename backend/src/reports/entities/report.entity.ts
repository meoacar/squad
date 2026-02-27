import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

export enum ReportReason {
    SPAM = 'SPAM',
    INAPPROPRIATE = 'INAPPROPRIATE',
    FAKE = 'FAKE',
    HARASSMENT = 'HARASSMENT',
    OTHER = 'OTHER',
}

export enum ReportStatus {
    PENDING = 'PENDING',
    REVIEWED = 'REVIEWED',
    RESOLVED = 'RESOLVED',
    DISMISSED = 'DISMISSED',
}

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    reporter_id: string;

    @Column({ type: 'uuid' })
    post_id: string;

    @Column({
        type: 'enum',
        enum: ReportReason,
    })
    reason: ReportReason;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.PENDING,
    })
    status: ReportStatus;

    @Column({ type: 'uuid', nullable: true })
    reviewed_by: string;

    @Column({ type: 'text', nullable: true })
    admin_notes: string;

    @Index('IDX_reports_priority')
    @Column({ type: 'integer', default: 0 })
    priority: number;

    @Index('IDX_reports_assigned_to')
    @Column({ type: 'uuid', nullable: true })
    assigned_to: string;

    @Column({ type: 'text', nullable: true })
    resolution_notes: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reporter_id' })
    reporter: User;

    @ManyToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reviewed_by' })
    reviewer: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigned_to' })
    assignedTo: User;
}
