import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchPostsDto } from './dto/search-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Public()
    @Get('posts')
    @ApiOperation({ summary: 'Search posts with advanced filters' })
    async searchPosts(@Query() searchDto: SearchPostsDto) {
        return this.searchService.searchPosts(searchDto);
    }

    @Public()
    @Get('users')
    @ApiOperation({ summary: 'Search users' })
    async searchUsers(
        @Query('query') query: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.searchService.searchUsers(query, page, limit);
    }

    @Post('reindex/posts')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reindex all posts (Admin only)' })
    async reindexPosts() {
        return this.searchService.reindexAllPosts();
    }

    @Post('reindex/users')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reindex all users (Admin only)' })
    async reindexUsers() {
        return this.searchService.reindexAllUsers();
    }
}
