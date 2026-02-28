import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
    constructor(private readonly blogService: BlogService) { }

    // Public endpoints
    @Get('posts')
    @ApiOperation({ summary: 'Get published blog posts (public)' })
    async getPublishedPosts(
        @Query('search') search?: string,
        @Query('category_id') category_id?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.blogService.findPublishedPosts({
            search,
            category_id,
            page: page || 1,
            limit: limit || 10,
        });
    }

    @Get('posts/:categorySlug/:postSlug')
    @ApiOperation({ summary: 'Get blog post by category and slug (public)' })
    async getPostByCategoryAndSlug(
        @Param('categorySlug') categorySlug: string,
        @Param('postSlug') postSlug: string,
    ) {
        return await this.blogService.findPostByCategoryAndSlug(categorySlug, postSlug);
    }

    @Get('posts/:slug')
    @ApiOperation({ summary: 'Get blog post by slug (public) - fallback' })
    async getPostBySlug(@Param('slug') slug: string) {
        return await this.blogService.findPostBySlug(slug);
    }

    @Get('categories')
    @ApiOperation({ summary: 'Get all categories (public)' })
    async getCategories() {
        return await this.blogService.findAllCategories();
    }

    // Admin endpoints
    @Post('admin/posts')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create blog post (admin only)' })
    async createPost(
        @Body() dto: CreateBlogPostDto,
        @CurrentUser() user: any,
    ) {
        return await this.blogService.createPost(dto, user.id);
    }

    @Get('admin/posts')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all blog posts (admin only)' })
    async getAllPosts(
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('category_id') category_id?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.blogService.findAllPosts({
            search,
            status,
            category_id,
            page: page || 1,
            limit: limit || 25,
        });
    }

    @Get('admin/posts/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get blog post by ID (admin only)' })
    async getPostById(@Param('id') id: string) {
        return await this.blogService.findPostById(id);
    }

    @Put('admin/posts/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update blog post (admin only)' })
    async updatePost(
        @Param('id') id: string,
        @Body() dto: UpdateBlogPostDto,
    ) {
        return await this.blogService.updatePost(id, dto);
    }

    @Delete('admin/posts/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete blog post (admin only)' })
    async deletePost(@Param('id') id: string) {
        await this.blogService.deletePost(id);
        return { message: 'Blog post deleted successfully' };
    }

    // Category admin endpoints
    @Post('admin/categories')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create category (admin only)' })
    async createCategory(@Body() dto: CreateBlogCategoryDto) {
        return await this.blogService.createCategory(dto);
    }

    @Put('admin/categories/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update category (admin only)' })
    async updateCategory(
        @Param('id') id: string,
        @Body() dto: UpdateBlogCategoryDto,
    ) {
        return await this.blogService.updateCategory(id, dto);
    }

    @Delete('admin/categories/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete category (admin only)' })
    async deleteCategory(@Param('id') id: string) {
        await this.blogService.deleteCategory(id);
        return { message: 'Category deleted successfully' };
    }
}
