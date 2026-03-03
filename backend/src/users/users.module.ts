import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Application } from '../applications/entities/application.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { Follow } from '../social/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Post, Application, Favorite, Follow])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
