import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { SearchPostsDto } from './dto/search-posts.dto';
import { PostStatus } from '../common/enums';

@Injectable()
export class SearchService implements OnModuleInit {
    private readonly logger = new Logger(SearchService.name);
    private readonly postsIndex = 'posts';
    private readonly usersIndex = 'users';

    constructor(
        private readonly elasticsearchService: ElasticsearchService,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async onModuleInit() {
        await this.createIndices();
    }

    private async createIndices() {
        try {
            // Posts index
            const postsIndexExists = await this.elasticsearchService.indices.exists({
                index: this.postsIndex,
            });

            if (!postsIndexExists) {
                await this.elasticsearchService.indices.create({
                    index: this.postsIndex,
                    settings: {
                        analysis: {
                            analyzer: {
                                turkish_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase', 'turkish_stop', 'turkish_stemmer'],
                                },
                            },
                            filter: {
                                turkish_stop: {
                                    type: 'stop',
                                    stopwords: '_turkish_',
                                },
                                turkish_stemmer: {
                                    type: 'stemmer',
                                    language: 'turkish',
                                },
                            },
                        },
                    },
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            title: {
                                type: 'text',
                                analyzer: 'turkish_analyzer',
                                fields: {
                                    keyword: { type: 'keyword' },
                                },
                            },
                            description: {
                                type: 'text',
                                analyzer: 'turkish_analyzer',
                            },
                            slug: { type: 'keyword' },
                            type: { type: 'keyword' },
                            region: { type: 'keyword' },
                            mode: { type: 'keyword' },
                            language: { type: 'keyword' },
                            required_roles: { type: 'keyword' },
                            tier_requirement: { type: 'keyword' },
                            status: { type: 'keyword' },
                            created_by: { type: 'keyword' },
                            creator_username: {
                                type: 'text',
                                analyzer: 'turkish_analyzer',
                                fields: {
                                    keyword: { type: 'keyword' },
                                },
                            },
                            view_count: { type: 'integer' },
                            application_count: { type: 'integer' },
                            is_boosted: { type: 'boolean' },
                            is_featured: { type: 'boolean' },
                            created_at: { type: 'date' },
                            expires_at: { type: 'date' },
                        },
                    },
                } as any);
                this.logger.log('Posts index created successfully');
            }

            // Users index
            const usersIndexExists = await this.elasticsearchService.indices.exists({
                index: this.usersIndex,
            });

            if (!usersIndexExists) {
                await this.elasticsearchService.indices.create({
                    index: this.usersIndex,
                    settings: {
                        analysis: {
                            analyzer: {
                                turkish_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase', 'turkish_stop', 'turkish_stemmer'],
                                },
                            },
                            filter: {
                                turkish_stop: {
                                    type: 'stop',
                                    stopwords: '_turkish_',
                                },
                                turkish_stemmer: {
                                    type: 'stemmer',
                                    language: 'turkish',
                                },
                            },
                        },
                    },
                    mappings: {
                        properties: {
                            id: { type: 'keyword' },
                            username: {
                                type: 'text',
                                analyzer: 'turkish_analyzer',
                                fields: {
                                    keyword: { type: 'keyword' },
                                },
                            },
                            bio: {
                                type: 'text',
                                analyzer: 'turkish_analyzer',
                            },
                            region: { type: 'keyword' },
                            language: { type: 'keyword' },
                            roles: { type: 'keyword' },
                            tier: { type: 'keyword' },
                            is_premium: { type: 'boolean' },
                            created_at: { type: 'date' },
                        },
                    },
                } as any);
                this.logger.log('Users index created successfully');
            }
        } catch (error) {
            this.logger.error('Error creating indices:', error);
        }
    }

    async indexPost(post: Post) {
        try {
            await this.elasticsearchService.index({
                index: this.postsIndex,
                id: post.id,
                document: {
                    id: post.id,
                    title: post.title,
                    description: post.description,
                    slug: post.slug,
                    type: post.type,
                    region: post.region,
                    mode: post.mode,
                    language: post.language,
                    required_roles: post.required_roles,
                    tier_requirement: post.tier_requirement,
                    status: post.status,
                    created_by: post.created_by,
                    creator_username: post.creator?.username,
                    view_count: post.view_count,
                    application_count: post.application_count,
                    is_boosted: post.is_boosted,
                    is_featured: post.is_featured,
                    created_at: post.created_at,
                    expires_at: post.expires_at,
                },
            });
            this.logger.log(`Post ${post.id} indexed successfully`);
        } catch (error) {
            this.logger.error(`Error indexing post ${post.id}:`, error);
        }
    }

    async indexUser(user: User) {
        try {
            await this.elasticsearchService.index({
                index: this.usersIndex,
                id: user.id,
                document: {
                    id: user.id,
                    username: user.username,
                    bio: user.bio,
                    region: user.region,
                    language: user.language,
                    roles: user.roles || [],
                    tier: user.tier || '',
                    is_premium: user.is_premium,
                    created_at: user.created_at,
                },
            });
            this.logger.log(`User ${user.id} indexed successfully`);
        } catch (error) {
            this.logger.error(`Error indexing user ${user.id}:`, error);
        }
    }

    async deletePost(postId: string) {
        try {
            await this.elasticsearchService.delete({
                index: this.postsIndex,
                id: postId,
            });
            this.logger.log(`Post ${postId} deleted from index`);
        } catch (error) {
            if (error.meta?.statusCode !== 404) {
                this.logger.error(`Error deleting post ${postId}:`, error);
            }
        }
    }

    async searchPosts(searchDto: SearchPostsDto) {
        const {
            query,
            type,
            region,
            mode,
            language,
            role,
            tier,
            page = 1,
            limit = 20,
            sort = 'relevance',
        } = searchDto;

        const must: any[] = [
            { term: { status: PostStatus.ACTIVE } },
            { range: { expires_at: { gte: 'now' } } },
        ];

        if (query) {
            must.push({
                multi_match: {
                    query,
                    fields: ['title^3', 'description^2', 'creator_username'],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                },
            });
        }

        const filter: any[] = [];

        if (type) filter.push({ term: { type } });
        if (region) filter.push({ term: { region } });
        if (mode) filter.push({ term: { mode } });
        if (language) filter.push({ term: { language } });
        if (role) filter.push({ term: { required_roles: role } });
        if (tier) filter.push({ term: { tier_requirement: tier } });

        const sortOptions: any[] = [
            { is_featured: { order: 'desc' } },
            { is_boosted: { order: 'desc' } },
        ];

        if (sort === 'newest') {
            sortOptions.push({ created_at: { order: 'desc' } });
        } else if (sort === 'popular') {
            sortOptions.push({ view_count: { order: 'desc' } });
            sortOptions.push({ application_count: { order: 'desc' } });
        } else if (sort === 'expiring_soon') {
            sortOptions.push({ expires_at: { order: 'asc' } });
        } else if (sort === 'relevance' && query) {
            sortOptions.push({ _score: { order: 'desc' } });
        }

        const from = (page - 1) * limit;

        try {
            const result = await this.elasticsearchService.search({
                index: this.postsIndex,
                query: {
                    bool: {
                        must,
                        filter,
                    },
                },
                sort: sortOptions,
                from,
                size: limit,
            } as any);

            const hits = result.hits.hits;
            const total = typeof result.hits.total === 'number'
                ? result.hits.total
                : result.hits.total?.value || 0;

            return {
                data: hits.map((hit: any) => hit._source),
                meta: {
                    total,
                    page,
                    limit,
                    total_pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Error searching posts:', error);
            throw error;
        }
    }

    async searchUsers(query: string, page = 1, limit = 20) {
        const from = (page - 1) * limit;

        try {
            const result = await this.elasticsearchService.search({
                index: this.usersIndex,
                query: {
                    multi_match: {
                        query,
                        fields: ['username^3', 'bio'],
                        type: 'best_fields',
                        fuzziness: 'AUTO',
                    },
                },
                from,
                size: limit,
            } as any);

            const hits = result.hits.hits;
            const total = typeof result.hits.total === 'number'
                ? result.hits.total
                : result.hits.total?.value || 0;

            return {
                data: hits.map((hit: any) => hit._source),
                meta: {
                    total,
                    page,
                    limit,
                    total_pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Error searching users:', error);
            throw error;
        }
    }

    async reindexAllPosts() {
        try {
            const posts = await this.postRepository.find({
                relations: ['creator'],
                where: { status: PostStatus.ACTIVE },
            });

            for (const post of posts) {
                await this.indexPost(post);
            }

            this.logger.log(`Reindexed ${posts.length} posts`);
            return { success: true, count: posts.length };
        } catch (error) {
            this.logger.error('Error reindexing posts:', error);
            throw error;
        }
    }

    async reindexAllUsers() {
        try {
            const users = await this.userRepository.find();

            for (const user of users) {
                await this.indexUser(user);
            }

            this.logger.log(`Reindexed ${users.length} users`);
            return { success: true, count: users.length };
        } catch (error) {
            this.logger.error('Error reindexing users:', error);
            throw error;
        }
    }
}
