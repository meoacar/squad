import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentType } from '../entities/payment.entity';

export class CreatePaymentDto {
    @IsEnum(PaymentType)
    type: PaymentType;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    @IsOptional()
    currency?: string = 'TRY';

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    callbackUrl?: string;
}
