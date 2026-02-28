import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Post } from './entities/post.entity';
import { Game } from '../games/entities/game.entity';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostsDto } from './dto/filter-posts.dto';
import { PostStatus } from '../common/enums';
import { SearchService } from '../search/search.service';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(Game)
        private readonly gameRepository: Repository<Game>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @Inject(forwardRef(() => SearchService))
        private readonly searchService: SearchService,
    ) { }

    private generateSlug(title: string): string {
        // Türkçe karakterleri İngilizce karşılıklarına çevir
        const turkishMap: { [key: string]: string } = {
            'ı': 'i', 'İ': 'i', 'ğ': 'g', 'Ğ': 'g',
            'ü': 'u', 'Ü': 'u', 'ş': 's', 'Ş': 's',
            'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c'
        };

        let slug = title.toLowerCase();

        // Türkçe karakterleri değiştir
        Object.keys(turkishMap).forEach(key => {
            slug = slug.replace(new RegExp(key, 'g'), turkishMap[key]);
        });

        // Diğer özel karakterleri temizle ve slug formatına çevir
        slug = slug
            .replace(/[^a-z0-9\s-]/g, '') // Sadece harf, rakam, boşluk ve tire
            .replace(/\s+/g, '-')          // Boşlukları tire yap
            .replace(/-+/g, '-')           // Birden fazla tire'yi tek tire yap
            .replace(/^-+|-+$/g, '')       // Baştaki ve sondaki tire'leri temizle
            .substring(0, 80);             // Maksimum 80 karakter

        return slug;
    }

    private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
        let slug = baseSlug;
        let counter = 1;

        while (true) {
            const query = this.postRepository.createQueryBuilder('post')
                .where('post.slug = :slug', { slug });

            if (excludeId) {
                query.andWhere('post.id != :excludeId', { excludeId });
            }

            const existing = await query.getOne();

            if (!existing) {
                return slug;
            }

            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
        // Check daily post limit
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const dailyLimit = user.is_premium ? 10 : 2;

        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const recentPostsCount = await this.postRepository.count({
            where: {
                created_by: userId,
                created_at: MoreThan(yesterday),
            },
        });

        if (recentPostsCount >= dailyLimit) {
            throw new BadRequestException(
                `Daily post limit reached. ${user.is_premium ? 'Premium' : 'Normal'} users can create ${dailyLimit} posts per 24 hours.`,
            );
        }

        // Get default game (PUBG Mobile)
        const game = await this.gameRepository.findOne({
            where: { slug: 'pubg-mobile' },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        // Calculate expiration date (30 days for normal users, 60 for premium)
        const expiresAt = new Date();
        const daysToAdd = user.is_premium ? 60 : 30;
        expiresAt.setDate(expiresAt.getDate() + daysToAdd);

        // Generate unique slug
        const baseSlug = this.generateSlug(createPostDto.title);
        const slug = await this.ensureUniqueSlug(baseSlug);

        const post = this.postRepository.create({
            ...createPostDto,
            slug,
            game_id: game.id,
            created_by: userId,
            expires_at: expiresAt,
            status: PostStatus.ACTIVE,
        });

        const savedPost = await this.postRepository.save(post);

        // Index to Elasticsearch
        const postWithRelations = await this.postRepository.findOne({
            where: { id: savedPost.id },
            relations: ['creator'],
        });
        if (postWithRelations) {
            await this.searchService.indexPost(postWithRelations);
        }

        return savedPost;
    }

    async findAll(filterDto: FilterPostsDto) {
        const { page = 1, limit = 20, sort = 'newest', search, ...filters } = filterDto;

        const query = this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.creator', 'creator')
            .leftJoinAndSelect('post.game', 'game')
            .where('post.status = :status', { status: PostStatus.ACTIVE })
            .andWhere('post.expires_at > :now', { now: new Date() });

        // Apply filters
        if (filters.type) {
            query.andWhere('post.type = :type', { type: filters.type });
        }
        if (filters.region) {
            query.andWhere('post.region = :region', { region: filters.region });
        }
        if (filters.mode) {
            query.andWhere('post.mode = :mode', { mode: filters.mode });
        }
        if (filters.language) {
            query.andWhere('post.language = :language', { language: filters.language });
        }
        if (filters.role) {
            query.andWhere(':role = ANY(post.required_roles)', { role: filters.role });
        }
        if (filters.tier) {
            query.andWhere('post.tier_requirement = :tier', { tier: filters.tier });
        }

        // Search
        if (search) {
            query.andWhere(
                '(post.title ILIKE :search OR post.description ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        // Sorting
        query.orderBy('post.is_featured', 'DESC');
        query.addOrderBy('post.is_boosted', 'DESC');

        if (sort === 'newest') {
            query.addOrderBy('post.created_at', 'DESC');
        } else if (sort === 'popular') {
            query.addOrderBy('post.view_count', 'DESC');
            query.addOrderBy('post.application_count', 'DESC');
        } else if (sort === 'expiring_soon') {
            query.addOrderBy('post.expires_at', 'ASC');
        }

        // Pagination
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);

        const [data, total] = await query.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<Post> {
        let post: Post | null = null;

        // Önce slug ile ara (tire içeriyorsa ve UUID formatında değilse)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (!isUuid) {
            // Slug ile ara
            post = await this.postRepository.findOne({
                where: { slug: id },
                relations: ['creator', 'game'],
            });
        } else {
            // UUID ile ara
            post = await this.postRepository.findOne({
                where: { id },
                relations: ['creator', 'game'],
            });
        }

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Increment view count
        await this.postRepository.increment({ id: post.id }, 'view_count', 1);

        return post;
    }

    async update(id: string, userId: string, updatePostDto: UpdatePostDto): Promise<Post> {
        const post = await this.findOne(id);

        if (post.created_by !== userId) {
            throw new ForbiddenException('You can only update your own posts');
        }

        await this.postRepository.update(id, updatePostDto);
        const updatedPost = await this.findOne(id);

        // Update Elasticsearch index
        await this.searchService.indexPost(updatedPost);

        return updatedPost;
    }

    async remove(id: string, userId: string): Promise<void> {
        const post = await this.findOne(id);

        if (post.created_by !== userId) {
            throw new ForbiddenException('You can only delete your own posts');
        }

        // Soft delete
        await this.postRepository.update(id, { status: PostStatus.DELETED });

        // Remove from Elasticsearch
        await this.searchService.deletePost(id);
    }

    async pause(id: string, userId: string): Promise<Post> {
        const post = await this.findOne(id);

        if (post.created_by !== userId) {
            throw new ForbiddenException('You can only pause your own posts');
        }

        await this.postRepository.update(id, { status: PostStatus.PAUSED });
        return await this.findOne(id);
    }

    async resume(id: string, userId: string): Promise<Post> {
        const post = await this.findOne(id);

        if (post.created_by !== userId) {
            throw new ForbiddenException('You can only resume your own posts');
        }

        await this.postRepository.update(id, { status: PostStatus.ACTIVE });
        return await this.findOne(id);
    }

    async getUserPosts(userId: string): Promise<Post[]> {
        return await this.postRepository.find({
            where: { created_by: userId },
            relations: ['game'],
            order: { created_at: 'DESC' },
        });
    }

    async getMetaTags(id: string) {
        const post = await this.findOne(id);

        return {
            title: `${post.title} | Squadbul`,
            description: post.description.substring(0, 160),
            keywords: [
                'PUBG Mobile',
                post.type,
                post.region,
                post.mode,
                ...post.required_roles,
            ].join(', '),
            og: {
                title: post.title,
                description: post.description.substring(0, 200),
                type: 'article',
                url: `https://squadbul.com/posts/${post.id}`,
            },
            twitter: {
                card: 'summary',
                title: post.title,
                description: post.description.substring(0, 200),
            },
        };
    }

    async getSitemap() {
        const posts = await this.postRepository.find({
            where: {
                status: PostStatus.ACTIVE,
                expires_at: MoreThan(new Date()),
            },
            select: ['id', 'updated_at'],
            order: { updated_at: 'DESC' },
        });

        return posts.map((post) => ({
            url: `https://squadbul.com/posts/${post.id}`,
            lastmod: post.updated_at.toISOString(),
            changefreq: 'daily',
            priority: 0.8,
        }));
    }
}
