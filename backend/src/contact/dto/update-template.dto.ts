import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class UpdateTemplateDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    subject?: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    content?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
