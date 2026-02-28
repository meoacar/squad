import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostType, Region, GameMode, Language } from '../../common/enums';

export class SearchPostsDto {
    @ApiPropertyOptional({ description: 'Search query' })
    @IsOptional()
    @IsString()
    query?: string;

    @ApiPropertyOptional({ enum: PostType })
    @IsOptional()
    @IsEnum(PostType)
    type?: PostType;

    @ApiPropertyOptional({ enum: Region })
    @IsOptional()
    @IsEnum(Region)
    region?: Region;

    @ApiPropertyOptional({ enum: GameMode })
    @IsOptional()
    @IsEnum(GameMode)
    mode?: GameMode;

    @ApiPropertyOptional({ enum: Language })
    @IsOptional()
    @IsEnum(Language)
    language?: Language;

    @ApiPropertyOptional({ description: 'Required role' })
    @IsOptional()
    @IsString()
    role?: string;

    @ApiPropertyOptional({ description: 'Tier requirement' })
    @IsOptional()
    @IsString()
    tier?: string;

    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({
        enum: ['relevance', 'newest', 'popular', 'expiring_soon'],
        default: 'relevance',
    })
    @IsOptional()
    @IsString()
    sort?: 'relevance' | 'newest' | 'popular' | 'expiring_soon' = 'relevance';
}
