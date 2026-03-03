import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', array: true })
    @Index('IDX_conversations_participants', { synchronize: false })
    participant_ids: string[];

    @Column({ type: 'uuid', nullable: true })
    last_message_id: string;

    @Column({ type: 'timestamp', nullable: true })
    last_message_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
