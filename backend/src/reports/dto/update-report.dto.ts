import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateReportDto {
    @ApiProperty({
        enum: ReportStatus,
        example: ReportStatus.RESOLVED,
        description: 'Report status',
    })
    @IsEnum(ReportStatus)
    status: ReportStatus;

    @ApiPropertyOptional({
        example: 'Post has been removed',
        description: 'Admin notes',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    admin_notes?: string;
}
