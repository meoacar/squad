import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
    Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FollowRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('follow_requests')
@Unique(['requester_id', 'target_id'])
@Check('"requester_id" != "target_id"')
export class FollowRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    requester_id: string;

    @Column({ type: 'uuid' })
    @Index()
    target_id: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: FollowRequestStatus.PENDING,
    })
    @Index()
    status: FollowRequestStatus;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'requester_id' })
    requester: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'target_id' })
    target: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
