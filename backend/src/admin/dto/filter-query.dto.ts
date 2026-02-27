import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterQueryDto {
    @ApiPropertyOptional({
        example: 'search term',
        description: 'Search query',
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        example: 1,
        description: 'Page number',
        minimum: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({
        example: 25,
        description: 'Items per page',
        minimum: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number = 25;

    @ApiPropertyOptional({
        example: 'created_at',
        description: 'Sort field',
    })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiPropertyOptional({
        example: 'DESC',
        description: 'Sort order',
        enum: ['ASC', 'DESC'],
    })
    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({
        example: '2024-01-01',
        description: 'Start date for filtering',
    })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({
        example: '2024-12-31',
        description: 'End date for filtering',
    })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiPropertyOptional({
        example: 'ACTIVE',
        description: 'Status filter',
    })
    @IsString()
    @IsOptional()
    status?: string;
}
