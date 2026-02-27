import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class FavoritesService {
    constructor(
        @InjectRepository(Favorite)
        private readonly favoriteRepository: Repository<Favorite>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
    ) { }

    async addFavorite(userId: string, postId: string): Promise<Favorite> {
        const post = await this.postRepository.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Check if already favorited
        const existing = await this.favoriteRepository.findOne({
            where: {
                user_id: userId,
                post_id: postId,
            },
        });

        if (existing) {
            throw new BadRequestException('Post already in favorites');
        }

        const favorite = this.favoriteRepository.create({
            user_id: userId,
            post_id: postId,
        });

        return await this.favoriteRepository.save(favorite);
    }

    async removeFavorite(userId: string, postId: string): Promise<void> {
        const favorite = await this.favoriteRepository.findOne({
            where: {
                user_id: userId,
                post_id: postId,
            },
        });

        if (!favorite) {
            throw new NotFoundException('Favorite not found');
        }

        await this.favoriteRepository.remove(favorite);
    }

    async getUserFavorites(userId: string): Promise<Post[]> {
        const favorites = await this.favoriteRepository.find({
            where: { user_id: userId },
            relations: ['post', 'post.game', 'post.creator'],
            order: { created_at: 'DESC' },
        });

        return favorites.map((fav) => fav.post);
    }

    async isFavorited(userId: string, postId: string): Promise<boolean> {
        const favorite = await this.favoriteRepository.findOne({
            where: {
                user_id: userId,
                post_id: postId,
            },
        });

        return !!favorite;
    }
}
