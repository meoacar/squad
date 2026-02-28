import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class UpdateApplicationDto {
    @ApiProperty({
        enum: ApplicationStatus,
        example: ApplicationStatus.ACCEPTED,
        description: 'Application status',
    })
    @IsEnum(ApplicationStatus)
    status: ApplicationStatus;

    @ApiPropertyOptional({
        description: 'Rejection reason (optional, only for REJECTED status)',
        example: 'Tier seviyesi uygun değil',
    })
    @IsOptional()
    @IsString()
    rejection_reason?: string;
}
