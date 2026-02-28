import { IsString, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { BlogPostStatus } from '../entities/blog-post.entity';

export class CreateBlogPostDto {
    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsString()
    @IsOptional()
    excerpt?: string;

    @IsString()
    @IsOptional()
    featured_image?: string;

    @IsEnum(BlogPostStatus)
    @IsOptional()
    status?: BlogPostStatus;

    @IsString()
    @IsOptional()
    category_id?: string;

    @IsArray()
    @IsOptional()
    tags?: string[];

    @IsString()
    @IsOptional()
    meta_title?: string;

    @IsString()
    @IsOptional()
    meta_description?: string;

    @IsBoolean()
    @IsOptional()
    is_featured?: boolean;
}
