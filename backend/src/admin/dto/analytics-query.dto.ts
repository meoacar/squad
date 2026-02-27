import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';

export enum AnalyticsPeriod {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
    CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
    @ApiPropertyOptional({
        enum: AnalyticsPeriod,
        example: AnalyticsPeriod.MONTH,
        description: 'Time period for analytics',
    })
    @IsEnum(AnalyticsPeriod)
    @IsOptional()
    period?: AnalyticsPeriod = AnalyticsPeriod.MONTH;

    @ApiPropertyOptional({
        example: '2024-01-01',
        description: 'Start date (required for custom period)',
    })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({
        example: '2024-12-31',
        description: 'End date (required for custom period)',
    })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiPropertyOptional({
        example: 'TR',
        description: 'Filter by region',
    })
    @IsString()
    @IsOptional()
    region?: string;

    @ApiPropertyOptional({
        example: 'PUBG',
        description: 'Filter by game',
    })
    @IsString()
    @IsOptional()
    game?: string;
}
