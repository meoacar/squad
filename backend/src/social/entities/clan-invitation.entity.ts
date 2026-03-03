import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Clan } from './clan.entity';

export enum ClanInvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

@Entity('clan_invitations')
export class ClanInvitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    clan_id: string;

    @Column({ type: 'uuid' })
    inviter_id: string;

    @Column({ type: 'uuid' })
    @Index()
    invitee_id: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: ClanInvitationStatus.PENDING,
    })
    @Index()
    status: ClanInvitationStatus;

    @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clan_id' })
    clan: Clan;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inviter_id' })
    inviter: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'invitee_id' })
    invitee: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
