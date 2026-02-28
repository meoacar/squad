import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { BlogPost } from './blog-post.entity';
import { User } from '../../users/entities/user.entity';

@Entity('blog_comments')
export class BlogComment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    post_id: string;

    @Column('uuid')
    user_id: string;

    @Column('text')
    content: string;

    @Column({ default: true })
    is_approved: boolean;

    @ManyToOne(() => BlogPost, post => post.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: BlogPost;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
