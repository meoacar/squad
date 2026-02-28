import { IsString, IsOptional } from 'class-validator';

export class WebhookPayTRDto {
    @IsString()
    merchant_oid: string;

    @IsString()
    status: string;

    @IsString()
    total_amount: string;

    @IsString()
    hash: string;

    @IsString()
    @IsOptional()
    failed_reason_code?: string;

    @IsString()
    @IsOptional()
    failed_reason_msg?: string;

    @IsString()
    @IsOptional()
    test_mode?: string;

    @IsString()
    @IsOptional()
    payment_type?: string;

    @IsString()
    @IsOptional()
    currency?: string;
}
