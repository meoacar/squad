import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BlogCategory } from './blog-category.entity';

export enum BlogPostStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

@Entity('blog_posts')
export class BlogPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ unique: true })
    slug: string;

    @Column('text')
    content: string;

    @Column('text', { nullable: true })
    excerpt: string;

    @Column({ nullable: true })
    featured_image: string;

    @Column({
        type: 'enum',
        enum: BlogPostStatus,
        default: BlogPostStatus.DRAFT,
    })
    status: BlogPostStatus;

    @Column({ nullable: true })
    category_id: string;

    @ManyToOne(() => BlogCategory, { nullable: true })
    @JoinColumn({ name: 'category_id' })
    category: BlogCategory;

    @Column({ nullable: true })
    author_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'author_id' })
    author: User;

    @Column({ default: 0 })
    view_count: number;

    @Column('simple-array', { nullable: true })
    tags: string[];

    @Column({ nullable: true })
    meta_title: string;

    @Column({ nullable: true })
    meta_description: string;

    @Column({ default: false })
    is_featured: boolean;

    @Column({ type: 'timestamp', nullable: true })
    published_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
