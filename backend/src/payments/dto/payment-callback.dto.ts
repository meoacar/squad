import { IsString, IsOptional } from 'class-validator';

export class PaymentCallbackDto {
    @IsString()
    status: string;

    @IsString()
    @IsOptional()
    paymentId?: string;

    @IsString()
    @IsOptional()
    conversationId?: string;

    @IsString()
    @IsOptional()
    token?: string;
}
