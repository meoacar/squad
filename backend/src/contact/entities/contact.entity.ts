import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum ContactStatus {
    NEW = 'NEW',
    READ = 'READ',
    REPLIED = 'REPLIED',
    ARCHIVED = 'ARCHIVED',
}

@Entity('contacts')
export class Contact {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    subject: string;

    @Column('text')
    message: string;

    @Column({
        type: 'enum',
        enum: ContactStatus,
        default: ContactStatus.NEW,
    })
    status: ContactStatus;

    @Column({ nullable: true })
    user_id: string;

    @Column({ type: 'text', nullable: true })
    admin_reply: string;

    @Column({ nullable: true })
    replied_by: string;

    @Column({ type: 'timestamp', nullable: true })
    replied_at: Date;

    @Column({ type: 'simple-json', nullable: true })
    attachments: string[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
