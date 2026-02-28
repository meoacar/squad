import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateBlogCategoryDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    order?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
