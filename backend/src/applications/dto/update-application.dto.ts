import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class UpdateApplicationDto {
    @ApiProperty({
        enum: ApplicationStatus,
        example: ApplicationStatus.ACCEPTED,
        description: 'Application status',
    })
    @IsEnum(ApplicationStatus)
    status: ApplicationStatus;
}
