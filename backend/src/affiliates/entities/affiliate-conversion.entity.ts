import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { AffiliateLink } from './affiliate-link.entity';
import { AffiliateClick } from './affiliate-click.entity';
import { User } from '../../users/entities/user.entity';

export enum ConversionStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity('affiliate_conversions')
export class AffiliateConversion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    link_id: string;

    @ManyToOne(() => AffiliateLink, link => link.conversions)
    @JoinColumn({ name: 'link_id' })
    link: AffiliateLink;

    @Column({ nullable: true })
    click_id: string;

    @ManyToOne(() => AffiliateClick, { nullable: true })
    @JoinColumn({ name: 'click_id' })
    click: AffiliateClick;

    @Column({ nullable: true })
    user_id: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column('decimal', { precision: 10, scale: 2 })
    commission: number;

    @Column({
        type: 'enum',
        enum: ConversionStatus,
        default: ConversionStatus.PENDING,
    })
    status: ConversionStatus;

    @CreateDateColumn()
    converted_at: Date;
}
