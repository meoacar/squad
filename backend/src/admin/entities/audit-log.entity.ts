import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    admin_id: string;

    @Column({ type: 'varchar', length: 50 })
    @Index()
    action_type: string;

    @Column({ type: 'varchar', length: 50 })
    target_type: string;

    @Column({ type: 'uuid', nullable: true })
    target_id: string;

    @Column({ type: 'jsonb', nullable: true })
    details: Record<string, any>;

    @Column({ type: 'inet', nullable: true })
    ip_address: string;

    @Column({ type: 'text', nullable: true })
    user_agent: string;

    @CreateDateColumn()
    @Index()
    created_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'admin_id' })
    admin: User;
}
