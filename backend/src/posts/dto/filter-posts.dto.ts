import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PostType, GameMode, Region, Language } from '../../common/enums';

export class FilterPostsDto {
    @ApiPropertyOptional({
        example: 'pubg-mobile',
        description: 'Game slug',
    })
    @IsOptional()
    @IsString()
    game?: string;

    @ApiPropertyOptional({
        enum: PostType,
        description: 'Post type',
    })
    @IsOptional()
    @IsEnum(PostType)
    type?: PostType;

    @ApiPropertyOptional({
        enum: Region,
        description: 'Region',
    })
    @IsOptional()
    @IsEnum(Region)
    region?: Region;

    @ApiPropertyOptional({
        enum: GameMode,
        description: 'Game mode',
    })
    @IsOptional()
    @IsEnum(GameMode)
    mode?: GameMode;

    @ApiPropertyOptional({
        enum: Language,
        description: 'Language',
    })
    @IsOptional()
    @IsEnum(Language)
    language?: Language;

    @ApiPropertyOptional({
        example: 'IGL',
        description: 'Required role',
    })
    @IsOptional()
    @IsString()
    role?: string;

    @ApiPropertyOptional({
        example: 'ACE',
        description: 'Tier',
    })
    @IsOptional()
    @IsString()
    tier?: string;

    @ApiPropertyOptional({
        example: 'looking for clan',
        description: 'Search query',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        example: 1,
        description: 'Page number',
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        example: 20,
        description: 'Items per page',
        minimum: 1,
        maximum: 50,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 20;

    @ApiPropertyOptional({
        example: 'newest',
        enum: ['newest', 'popular', 'expiring_soon'],
        description: 'Sort order',
    })
    @IsOptional()
    @IsString()
    sort?: string = 'newest';
}
