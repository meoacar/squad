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

@Entity('admin_roles')
export class AdminRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    user_id: string;

    @Column({ type: 'varchar', length: 50 })
    @Index()
    role: string; // SUPER_ADMIN, ADMIN, MODERATOR, VIEWER

    @Column({ type: 'jsonb', nullable: true })
    permissions: Record<string, any>;

    @Column({ type: 'uuid', nullable: true })
    granted_by: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    granted_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'granted_by' })
    grantedBy: User;
}
