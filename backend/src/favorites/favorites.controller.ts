import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Post('posts/:postId')
    @ApiOperation({ summary: 'Add post to favorites' })
    @ApiResponse({ status: 201, description: 'Post added to favorites' })
    async addFavorite(@CurrentUser() user: User, @Param('postId') postId: string) {
        return await this.favoritesService.addFavorite(user.id, postId);
    }

    @Delete('posts/:postId')
    @ApiOperation({ summary: 'Remove post from favorites' })
    async removeFavorite(@CurrentUser() user: User, @Param('postId') postId: string) {
        await this.favoritesService.removeFavorite(user.id, postId);
        return { message: 'Post removed from favorites' };
    }

    @Get()
    @ApiOperation({ summary: 'Get user favorites' })
    async getFavorites(@CurrentUser() user: User) {
        return await this.favoritesService.getUserFavorites(user.id);
    }

    @Get('posts/:postId/check')
    @ApiOperation({ summary: 'Check if post is favorited' })
    async checkFavorite(@CurrentUser() user: User, @Param('postId') postId: string) {
        const isFavorited = await this.favoritesService.isFavorited(user.id, postId);
        return { is_favorited: isFavorited };
    }
}
