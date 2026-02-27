import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    MaxLength,
    IsBoolean,
    IsArray,
    IsObject,
    IsEnum,
} from 'class-validator';
import { Language } from '../../common/enums';

export class UpdateProfileDto {
    @ApiPropertyOptional({
        example: 'ProGamer123',
        description: 'PUBG Mobile nickname',
        maxLength: 20,
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    pubg_nickname?: string;

    @ApiPropertyOptional({
        example: '5123456789',
        description: 'PUBG Mobile ID',
    })
    @IsOptional()
    @IsString()
    pubg_id?: string;

    @ApiPropertyOptional({
        example: ['IGL', 'ASSAULTER'],
        description: 'Player roles',
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    roles?: string[];

    @ApiPropertyOptional({
        example: 'ACE',
        description: 'Current tier',
    })
    @IsOptional()
    @IsString()
    tier?: string;

    @ApiPropertyOptional({
        example: { weekdays: ['evening'], weekends: ['afternoon', 'evening'] },
        description: 'Play schedule',
    })
    @IsOptional()
    @IsObject()
    play_schedule?: Record<string, any>;

    @ApiPropertyOptional({
        example: true,
        description: 'Has microphone',
    })
    @IsOptional()
    @IsBoolean()
    mic?: boolean;

    @ApiPropertyOptional({
        example: 'Experienced PUBG Mobile player looking for competitive clan',
        description: 'Bio (max 280 characters)',
        maxLength: 280,
    })
    @IsOptional()
    @IsString()
    @MaxLength(280)
    bio?: string;

    @ApiPropertyOptional({
        example: 'username#1234',
        description: 'Discord username',
        maxLength: 37,
    })
    @IsOptional()
    @IsString()
    @MaxLength(37)
    discord_username?: string;

    @ApiPropertyOptional({
        example: { youtube: 'https://youtube.com/@user', twitch: 'https://twitch.tv/user' },
        description: 'Social media links',
    })
    @IsOptional()
    @IsObject()
    social_links?: Record<string, string>;

    @ApiPropertyOptional({
        example: Language.EN,
        enum: Language,
        description: 'Preferred language',
    })
    @IsOptional()
    @IsEnum(Language)
    language?: Language;

    @ApiPropertyOptional({
        example: 'PUBLIC',
        description: 'Profile visibility',
    })
    @IsOptional()
    @IsString()
    profile_visibility?: string;

    @ApiPropertyOptional({
        example: false,
        description: 'Show email on profile',
    })
    @IsOptional()
    @IsBoolean()
    show_email?: boolean;
}
