import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MinLength, MaxLength, IsOptional } from 'class-validator';

@Entity('clans')
@Check('LENGTH("name") >= 3 AND LENGTH("name") <= 30')
export class Clan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 30, unique: true })
    @Index()
    @MinLength(3)
    @MaxLength(30)
    name: string;

    @Column({ type: 'varchar', length: 5, nullable: true })
    @IsOptional()
    tag: string;

    @Column({ type: 'text', nullable: true })
    @IsOptional()
    description: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @IsOptional()
    avatar_url: string;

    @Column({ type: 'varchar', length: 50, nullable: true, default: 'TR' })
    @IsOptional()
    region: string;

    @Column({ type: 'varchar', length: 50, nullable: true, default: 'TR' })
    @IsOptional()
    language: string;

    @Column({ type: 'varchar', length: 50, nullable: true, default: 'BRONZE' })
    @IsOptional()
    min_tier: string;

    @Column({ type: 'integer', default: 50 })
    max_members: number;

    @Column({ type: 'boolean', default: true })
    is_recruiting: boolean;

    @Column({ type: 'text', nullable: true })
    @IsOptional()
    requirements: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @IsOptional()
    discord_url: string;

    @Column({ type: 'uuid' })
    @Index()
    creator_id: string;

    @Column({ type: 'integer', default: 1 })
    member_count: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'creator_id' })
    creator: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
