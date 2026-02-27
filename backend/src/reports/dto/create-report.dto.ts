import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ReportReason } from '../entities/report.entity';

export class CreateReportDto {
    @ApiProperty({
        enum: ReportReason,
        example: ReportReason.SPAM,
        description: 'Report reason',
    })
    @IsEnum(ReportReason)
    reason: ReportReason;

    @ApiPropertyOptional({
        example: 'This post contains spam content',
        description: 'Additional description',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}
