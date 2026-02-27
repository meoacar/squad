import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export enum ReportResolutionStatus {
    RESOLVED = 'RESOLVED',
    DISMISSED = 'DISMISSED',
}

export enum ReportAction {
    WARN = 'WARN',
    SUSPEND = 'SUSPEND',
    BAN = 'BAN',
    DELETE_CONTENT = 'DELETE_CONTENT',
    NONE = 'NONE',
}

export class ResolveReportDto {
    @ApiProperty({
        enum: ReportResolutionStatus,
        example: ReportResolutionStatus.RESOLVED,
        description: 'Resolution status',
    })
    @IsEnum(ReportResolutionStatus)
    status: ReportResolutionStatus;

    @ApiProperty({
        example: 'Report reviewed and action taken',
        description: 'Resolution notes',
    })
    @IsString()
    @IsNotEmpty()
    resolution: string;

    @ApiProperty({
        enum: ReportAction,
        example: ReportAction.WARN,
        description: 'Action taken on the reported content/user',
    })
    @IsEnum(ReportAction)
    action: ReportAction;

    @ApiPropertyOptional({
        example: { days: 7, reason: 'Violation of guidelines' },
        description: 'Additional details about the action taken',
    })
    @IsObject()
    @IsOptional()
    actionDetails?: Record<string, any>;
}
