import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { AffiliateLink } from './affiliate-link.entity';
import { User } from '../../users/entities/user.entity';

@Entity('affiliate_clicks')
export class AffiliateClick {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    link_id: string;

    @ManyToOne(() => AffiliateLink, link => link.clicks)
    @JoinColumn({ name: 'link_id' })
    link: AffiliateLink;

    @Column({ nullable: true })
    user_id: string | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ nullable: true })
    ip_address: string;

    @Column('text', { nullable: true })
    user_agent: string;

    @Column('text', { nullable: true })
    referrer: string;

    @CreateDateColumn()
    clicked_at: Date;
}
