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

@Entity('follows')
@Unique(['follower_id', 'following_id'])
@Check('"follower_id" != "following_id"')
export class Follow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    follower_id: string;

    @Column({ type: 'uuid' })
    @Index()
    following_id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'follower_id' })
    follower: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'following_id' })
    following: User;

    @CreateDateColumn()
    created_at: Date;
}
