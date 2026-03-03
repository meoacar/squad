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
import { Clan } from './clan.entity';

export enum ClanMemberRole {
    LEADER = 'leader',
    CO_LEADER = 'co_leader',
    MODERATOR = 'moderator',
    MEMBER = 'member',
}

@Entity('clan_members')
@Unique(['clan_id', 'user_id'])
export class ClanMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    clan_id: string;

    @Column({ type: 'uuid' })
    @Index()
    user_id: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: ClanMemberRole.MEMBER,
    })
    role: ClanMemberRole;

    @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clan_id' })
    clan: Clan;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    joined_at: Date;
}
