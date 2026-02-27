import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('games')
export class Game {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ unique: true })
    @Index()
    slug: string;

    @Column({ nullable: true })
    icon_url: string;

    @Column({ default: true })
    @Index()
    is_active: boolean;

    @Column({ default: 1 })
    display_order: number;

    @CreateDateColumn()
    created_at: Date;
}
