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
import { Clan } from './clan.entity';
import { MaxLength } from 'class-validator';

@Entity('clan_announcements')
@Check('LENGTH("content") <= 1000')
export class ClanAnnouncement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    clan_id: string;

    @Column({ type: 'uuid' })
    author_id: string;

    @Column({ type: 'text' })
    @MaxLength(1000)
    content: string;

    @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clan_id' })
    clan: Clan;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @CreateDateColumn()
    @Index()
    created_at: Date;

    @Column({ type: 'timestamp' })
    @Index()
    expires_at: Date;
}
