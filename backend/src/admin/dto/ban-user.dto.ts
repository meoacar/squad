import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class BanUserDto {
    @ApiProperty({
        example: 'Repeated violations of community guidelines',
        description: 'Reason for banning the user',
    })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the ban is permanent',
    })
    @IsBoolean()
    @IsOptional()
    permanent?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether to notify the user about the ban',
    })
    @IsBoolean()
    @IsOptional()
    notifyUser?: boolean;
}
