import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost, BlogPostStatus } from './entities/blog-post.entity';
import { BlogCategory } from './entities/blog-category.entity';
import { BlogComment } from './entities/blog-comment.entity';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';

@Injectable()
export class BlogService {
    constructor(
        @InjectRepository(BlogPost)
        private readonly blogPostRepository: Repository<BlogPost>,
        @InjectRepository(BlogCategory)
        private readonly blogCategoryRepository: Repository<BlogCategory>,
        @InjectRepository(BlogComment)
        private readonly commentRepository: Repository<BlogComment>,
    ) { }

    // Blog Posts
    async createPost(dto: CreateBlogPostDto, authorId: string): Promise<BlogPost> {
        const slug = this.generateSlug(dto.title);

        const post = this.blogPostRepository.create({
            ...dto,
            slug,
            author_id: authorId,
            published_at: dto.status === BlogPostStatus.PUBLISHED ? new Date() : undefined,
        });

        return await this.blogPostRepository.save(post);
    }

    async findAllPosts(filters?: any): Promise<{ posts: BlogPost[]; total: number }> {
        const { search, status, category_id, page = 1, limit = 10 } = filters || {};

        const query = this.blogPostRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.category', 'category')
            .leftJoinAndSelect('post.author', 'author');

        if (search) {
            query.andWhere('(post.title LIKE :search OR post.content LIKE :search)', {
                search: `%${search}%`,
            });
        }

        if (status) {
            query.andWhere('post.status = :status', { status });
        }

        if (category_id) {
            query.andWhere('post.category_id = :category_id', { category_id });
        }

        query.orderBy('post.created_at', 'DESC');
        query.skip((page - 1) * limit);
        query.take(limit);

        const [posts, total] = await query.getManyAndCount();

        return { posts, total };
    }

    async findPublishedPosts(filters?: any): Promise<{ posts: BlogPost[]; total: number }> {
        return this.findAllPosts({ ...filters, status: BlogPostStatus.PUBLISHED });
    }

    async findPostByCategoryAndSlug(categorySlug: string, postSlug: string): Promise<BlogPost> {
        const post = await this.blogPostRepository.findOne({
            where: {
                slug: postSlug,
                status: BlogPostStatus.PUBLISHED
            },
            relations: ['category', 'author'],
        });

        if (!post) {
            throw new NotFoundException('Blog post not found');
        }

        // Kategori slug'ını kontrol et
        if (post.category?.slug !== categorySlug) {
            throw new NotFoundException('Blog post not found in this category');
        }

        // Increment view count
        await this.blogPostRepository.increment({ id: post.id }, 'view_count', 1);

        return post;
    }

    async findPostBySlug(slug: string): Promise<BlogPost> {
        const post = await this.blogPostRepository.findOne({
            where: { slug, status: BlogPostStatus.PUBLISHED },
            relations: ['category', 'author'],
        });

        if (!post) {
            throw new NotFoundException('Blog post not found');
        }

        // Increment view count
        await this.blogPostRepository.increment({ id: post.id }, 'view_count', 1);

        return post;
    }

    async findPostById(id: string): Promise<BlogPost> {
        const post = await this.blogPostRepository.findOne({
            where: { id },
            relations: ['category', 'author'],
        });

        if (!post) {
            throw new NotFoundException('Blog post not found');
        }

        return post;
    }

    async updatePost(id: string, dto: UpdateBlogPostDto): Promise<BlogPost> {
        const post = await this.findPostById(id);

        if (dto.title && dto.title !== post.title) {
            post.slug = this.generateSlug(dto.title);
        }

        if (dto.status === BlogPostStatus.PUBLISHED && !post.published_at) {
            post.published_at = new Date();
        }

        Object.assign(post, dto);

        return await this.blogPostRepository.save(post);
    }

    async deletePost(id: string): Promise<void> {
        const post = await this.findPostById(id);
        await this.blogPostRepository.remove(post);
    }

    // Blog Categories
    async createCategory(dto: CreateBlogCategoryDto): Promise<BlogCategory> {
        const slug = this.generateSlug(dto.name);

        const category = this.blogCategoryRepository.create({
            ...dto,
            slug,
        });

        return await this.blogCategoryRepository.save(category);
    }

    async findAllCategories(): Promise<BlogCategory[]> {
        return await this.blogCategoryRepository.find({
            where: { is_active: true },
            order: { order: 'ASC', name: 'ASC' },
        });
    }

    async findCategoryById(id: string): Promise<BlogCategory> {
        const category = await this.blogCategoryRepository.findOne({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async updateCategory(id: string, dto: UpdateBlogCategoryDto): Promise<BlogCategory> {
        const category = await this.findCategoryById(id);

        if (dto.name && dto.name !== category.name) {
            category.slug = this.generateSlug(dto.name);
        }

        Object.assign(category, dto);

        return await this.blogCategoryRepository.save(category);
    }

    async deleteCategory(id: string): Promise<void> {
        const category = await this.findCategoryById(id);
        await this.blogCategoryRepository.remove(category);
    }

    // Helper methods
    private generateSlug(text: string): string {
        const turkishMap: { [key: string]: string } = {
            'ç': 'c', 'Ç': 'C',
            'ğ': 'g', 'Ğ': 'G',
            'ı': 'i', 'İ': 'I',
            'ö': 'o', 'Ö': 'O',
            'ş': 's', 'Ş': 'S',
            'ü': 'u', 'Ü': 'U',
        };

        let slug = text;
        Object.keys(turkishMap).forEach(key => {
            slug = slug.replace(new RegExp(key, 'g'), turkishMap[key]);
        });

        return slug
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '') + '-' + Date.now();
    }

    // Comments
    async createComment(postId: string, userId: string, content: string) {
        const comment = this.commentRepository.create({
            post_id: postId,
            user_id: userId,
            content,
        });
        return await this.commentRepository.save(comment);
    }

    async getCommentsByPost(postId: string) {
        return await this.commentRepository.find({
            where: { post_id: postId, is_approved: true },
            relations: ['user'],
            order: { created_at: 'DESC' },
        });
    }

    async deleteComment(commentId: string) {
        await this.commentRepository.delete(commentId);
    }

    async approveComment(commentId: string) {
        await this.commentRepository.update(commentId, { is_approved: true });
    }
}
