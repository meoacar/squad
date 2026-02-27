import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { Favorite } from './entities/favorite.entity';
import { Post } from '../posts/entities/post.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Favorite, Post])],
    providers: [FavoritesService],
    controllers: [FavoritesController],
    exports: [FavoritesService],
})
export class FavoritesModule { }
