import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateApplicationDto {
    @ApiPropertyOptional({
        example: 'I am an experienced player with ACE tier...',
        description: 'Application message',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    message?: string;
}
