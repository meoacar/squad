import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { AffiliateProvider, AffiliateCategory } from '../entities/affiliate-link.entity';

export class CreateAffiliateLinkDto {
    @IsString()
    name: string;

    @IsString()
    url: string;

    @IsString()
    short_code: string;

    @IsEnum(AffiliateProvider)
    provider: AffiliateProvider;

    @IsEnum(AffiliateCategory)
    category: AffiliateCategory;

    @IsNumber()
    @Min(0)
    @Max(100)
    commission_rate: number;

    @IsString()
    @IsOptional()
    image_url?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    price?: string;

    @IsNumber()
    @Min(0)
    @Max(5)
    @IsOptional()
    rating?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    display_locations?: string[];
}
