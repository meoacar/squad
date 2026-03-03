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
import { Conversation } from './conversation.entity';
import { Clan } from './clan.entity';
import { MaxLength } from 'class-validator';

export enum MessageType {
    DIRECT = 'direct',
    GROUP = 'group',
}

@Entity('messages')
@Check('LENGTH("content") <= 2000')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    sender_id: string;

    @Column({ type: 'text' })
    @MaxLength(2000)
    content: string;

    @Column({
        type: 'varchar',
        length: 20,
    })
    message_type: MessageType;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    conversation_id: string;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    group_id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'group_id' })
    group: Clan;

    @CreateDateColumn()
    @Index()
    created_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    edited_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    deleted_at: Date;
}
