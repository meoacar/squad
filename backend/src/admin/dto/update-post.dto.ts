import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsInt,
    Min,
    MaxLength,
    IsBoolean,
} from 'class-validator';
import { PostStatus } from '../../common/enums';

export class UpdatePostDto {
    @ApiPropertyOptional({
        example: 'Updated post title',
        description: 'Post title',
        maxLength: 80,
    })
    @IsString()
    @IsOptional()
    @MaxLength(80)
    title?: string;

    @ApiPropertyOptional({
        example: 'Updated post description',
        description: 'Post description',
        maxLength: 1500,
    })
    @IsString()
    @IsOptional()
    @MaxLength(1500)
    description?: string;

    @ApiPropertyOptional({
        enum: PostStatus,
        example: PostStatus.ACTIVE,
        description: 'Post status',
    })
    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus;

    @ApiPropertyOptional({
        example: 2,
        description: 'Number of available slots',
    })
    @IsInt()
    @Min(0)
    @IsOptional()
    slots_available?: number;

    @ApiPropertyOptional({
        example: 'Admin notes about this post',
        description: 'Admin notes',
    })
    @IsString()
    @IsOptional()
    admin_notes?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the post is boosted',
    })
    @IsBoolean()
    @IsOptional()
    is_boosted?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the post is featured',
    })
    @IsBoolean()
    @IsOptional()
    is_featured?: boolean;
}
