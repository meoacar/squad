import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum SettingCategory {
    GENERAL = 'GENERAL',
    PAYMENT = 'PAYMENT',
    EMAIL = 'EMAIL',
    SECURITY = 'SECURITY',
    FEATURES = 'FEATURES',
    LIMITS = 'LIMITS',
}

@Entity('settings')
export class Setting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Index()
    key: string;

    @Column({ type: 'text' })
    value: string;

    @Column({
        type: 'enum',
        enum: SettingCategory,
        default: SettingCategory.GENERAL,
    })
    @Index()
    category: SettingCategory;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: false })
    is_public: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
