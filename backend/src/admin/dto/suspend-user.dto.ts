import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class SuspendUserDto {
    @ApiProperty({
        example: 7,
        description: 'Number of days to suspend the user',
        minimum: 1,
        maximum: 90,
    })
    @IsInt()
    @Min(1)
    @Max(90)
    days: number;

    @ApiProperty({
        example: 'Violation of community guidelines',
        description: 'Reason for suspension',
    })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether to notify the user about the suspension',
    })
    @IsBoolean()
    @IsOptional()
    notifyUser?: boolean;
}
