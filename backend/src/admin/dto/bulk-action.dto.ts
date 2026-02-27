import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString, IsOptional, ArrayMinSize } from 'class-validator';

export enum BulkActionType {
    SUSPEND = 'SUSPEND',
    BAN = 'BAN',
    DELETE = 'DELETE',
    ACTIVATE = 'ACTIVATE',
    DEACTIVATE = 'DEACTIVATE',
}

export class BulkActionDto {
    @ApiProperty({
        example: ['uuid1', 'uuid2', 'uuid3'],
        description: 'Array of IDs to perform action on',
        type: [String],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    ids: string[];

    @ApiProperty({
        enum: BulkActionType,
        example: BulkActionType.SUSPEND,
        description: 'Type of bulk action to perform',
    })
    @IsEnum(BulkActionType)
    action: BulkActionType;

    @ApiPropertyOptional({
        example: 'Bulk action reason',
        description: 'Reason for the bulk action',
    })
    @IsString()
    @IsOptional()
    reason?: string;

    @ApiPropertyOptional({
        example: { days: 7 },
        description: 'Additional parameters for the action',
    })
    @IsOptional()
    params?: Record<string, any>;
}
