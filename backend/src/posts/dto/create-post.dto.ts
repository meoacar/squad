import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEnum,
    MinLength,
    MaxLength,
    IsOptional,
    IsArray,
    IsInt,
    Min,
    Max,
    IsObject,
} from 'class-validator';
import { PostType, GameMode, Region, Language } from '../../common/enums';

export class CreatePostDto {
    @ApiProperty({
        example: PostType.CLAN_RECRUIT,
        enum: PostType,
        description: 'Post type',
    })
    @IsEnum(PostType)
    type: PostType;

    @ApiProperty({
        example: 'Looking for skilled players - ACE+ tier',
        description: 'Post title (10-80 characters)',
        minLength: 10,
        maxLength: 80,
    })
    @IsString()
    @MinLength(10)
    @MaxLength(80)
    title: string;

    @ApiProperty({
        example: 'We are a competitive clan looking for experienced players. Must have ACE tier or higher, good communication skills, and available for daily practice.',
        description: 'Post description (50-1500 characters)',
        minLength: 50,
        maxLength: 1500,
    })
    @IsString()
    @MinLength(50)
    @MaxLength(1500)
    description: string;

    @ApiProperty({
        example: Region.TR,
        enum: Region,
        description: 'Region',
    })
    @IsEnum(Region)
    region: Region;

    @ApiProperty({
        example: GameMode.RANKED,
        enum: GameMode,
        description: 'Game mode',
    })
    @IsEnum(GameMode)
    mode: GameMode;

    @ApiProperty({
        example: Language.TR,
        enum: Language,
        description: 'Language',
    })
    @IsEnum(Language)
    language: Language;

    @ApiPropertyOptional({
        example: ['IGL', 'ASSAULTER'],
        description: 'Required roles',
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    required_roles?: string[];

    @ApiPropertyOptional({
        example: 'ACE',
        description: 'Tier requirement',
    })
    @IsOptional()
    @IsString()
    tier_requirement?: string;

    @ApiPropertyOptional({
        example: 'DIAMOND',
        description: 'Minimum tier',
    })
    @IsOptional()
    @IsString()
    min_tier?: string;

    @ApiPropertyOptional({
        example: 'CONQUEROR',
        description: 'Maximum tier',
    })
    @IsOptional()
    @IsString()
    max_tier?: string;

    @ApiPropertyOptional({
        example: 3,
        description: 'Number of slots available (1-10)',
        minimum: 1,
        maximum: 10,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    slots_available?: number;

    @ApiPropertyOptional({
        example: { mic: true, age_min: 18, experience: 'advanced' },
        description: 'Additional requirements',
    })
    @IsOptional()
    @IsObject()
    requirements?: Record<string, any>;
}
