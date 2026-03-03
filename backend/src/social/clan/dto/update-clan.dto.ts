import { IsString, IsOptional, MinLength, MaxLength, IsUrl, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class UpdateClanDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(5)
    tag?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsUrl()
    avatar_url?: string;

    @IsOptional()
    @IsString()
    region?: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsString()
    min_tier?: string;

    @IsOptional()
    @IsInt()
    @Min(10)
    @Max(100)
    max_members?: number;

    @IsOptional()
    @IsBoolean()
    is_recruiting?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    requirements?: string;

    @IsOptional()
    @IsUrl()
    discord_url?: string;
}
