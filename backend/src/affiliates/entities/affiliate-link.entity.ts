import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { AffiliateClick } from './affiliate-click.entity';
import { AffiliateConversion } from './affiliate-conversion.entity';

export enum AffiliateProvider {
    AMAZON = 'AMAZON',
    ALIEXPRESS = 'ALIEXPRESS',
    CODASHOP = 'CODASHOP',
    RAZER = 'RAZER',
    NORDVPN = 'NORDVPN',
    CUSTOM = 'CUSTOM',
}

export enum AffiliateCategory {
    GAMING_GEAR = 'GAMING_GEAR',
    UC = 'UC',
    VPN = 'VPN',
    SOFTWARE = 'SOFTWARE',
    ACCESSORIES = 'ACCESSORIES',
    OTHER = 'OTHER',
}

@Entity('affiliate_links')
export class AffiliateLink {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('text')
    url: string;

    @Column({ unique: true })
    short_code: string;

    @Column({
        type: 'enum',
        enum: AffiliateProvider,
    })
    provider: AffiliateProvider;

    @Column({
        type: 'enum',
        enum: AffiliateCategory,
    })
    category: AffiliateCategory;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    commission_rate: number;

    @Column({ nullable: true })
    image_url: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ nullable: true })
    price: string;

    @Column('decimal', { precision: 3, scale: 1, default: 0, nullable: true })
    rating: number;

    @Column({ default: 0 })
    click_count: number;

    @Column({ default: 0 })
    conversion_count: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    revenue: number;

    @Column({ default: true })
    is_active: boolean;

    @Column('simple-array', { nullable: true })
    display_locations: string[];

    @OneToMany(() => AffiliateClick, click => click.link)
    clicks: AffiliateClick[];

    @OneToMany(() => AffiliateConversion, conversion => conversion.link)
    conversions: AffiliateConversion[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
