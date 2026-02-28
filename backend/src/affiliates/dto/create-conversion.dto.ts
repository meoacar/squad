import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ConversionStatus } from '../entities/affiliate-conversion.entity';

export class CreateConversionDto {
    @IsString()
    link_id: string;

    @IsString()
    @IsOptional()
    click_id?: string;

    @IsString()
    @IsOptional()
    user_id?: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsNumber()
    @Min(0)
    commission: number;

    @IsEnum(ConversionStatus)
    @IsOptional()
    status?: ConversionStatus;
}
