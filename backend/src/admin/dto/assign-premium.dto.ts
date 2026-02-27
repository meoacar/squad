import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class AssignPremiumDto {
    @ApiProperty({
        example: 30,
        description: 'Number of days for premium',
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    days: number;

    @ApiPropertyOptional({
        example: 'BASIC',
        description: 'Premium tier',
    })
    @IsOptional()
    @IsString()
    tier?: string;
}
