import {
    Controller,
    Get,
    Post as HttpPost,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostsDto } from './dto/filter-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('posts')
@Controller('posts')
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @HttpPost()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new post' })
    @ApiResponse({ status: 201, description: 'Post created successfully' })
    async create(@CurrentUser() user: User, @Body() createPostDto: CreatePostDto) {
        return await this.postsService.create(user.id, createPostDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all posts with filters' })
    @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
    async findAll(@Query() filterDto: FilterPostsDto) {
        return await this.postsService.findAll(filterDto);
    }

    @Get('my-posts')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user posts' })
    async getMyPosts(@CurrentUser() user: User) {
        return await this.postsService.getUserPosts(user.id);
    }

    @Get('sitemap')
    @ApiOperation({ summary: 'Get sitemap for all active posts' })
    @ApiResponse({ status: 200, description: 'Sitemap retrieved successfully' })
    async getSitemap() {
        return await this.postsService.getSitemap();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get post by ID' })
    @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    async findOne(@Param('id') id: string) {
        return await this.postsService.findOne(id);
    }

    @Get(':id/meta')
    @ApiOperation({ summary: 'Get SEO meta tags for post' })
    @ApiResponse({ status: 200, description: 'Meta tags retrieved successfully' })
    async getMetaTags(@Param('id') id: string) {
        return await this.postsService.getMetaTags(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update post' })
    @ApiResponse({ status: 200, description: 'Post updated successfully' })
    async update(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() updatePostDto: UpdatePostDto,
    ) {
        return await this.postsService.update(id, user.id, updatePostDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete post (soft delete)' })
    @ApiResponse({ status: 200, description: 'Post deleted successfully' })
    async remove(@Param('id') id: string, @CurrentUser() user: User) {
        await this.postsService.remove(id, user.id);
        return { message: 'Post deleted successfully' };
    }

    @HttpPost(':id/pause')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Pause post' })
    async pause(@Param('id') id: string, @CurrentUser() user: User) {
        return await this.postsService.pause(id, user.id);
    }

    @HttpPost(':id/resume')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Resume post' })
    async resume(@Param('id') id: string, @CurrentUser() user: User) {
        return await this.postsService.resume(id, user.id);
    }
}
