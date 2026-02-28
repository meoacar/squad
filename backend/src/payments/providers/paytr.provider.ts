import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
    IPaymentProvider,
    PaymentRequest,
    PaymentResponse,
    PaymentVerification,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class PayTRProvider implements IPaymentProvider {
    private readonly logger = new Logger(PayTRProvider.name);
    private readonly merchantId: string;
    private readonly merchantKey: string;
    private readonly merchantSalt: string;
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.merchantId = this.configService.get<string>('PAYTR_MERCHANT_ID') || 'your_paytr_merchant_id';
        this.merchantKey = this.configService.get<string>('PAYTR_MERCHANT_KEY') || 'your_paytr_merchant_key';
        this.merchantSalt = this.configService.get<string>('PAYTR_MERCHANT_SALT') || 'your_paytr_merchant_salt';
        this.baseUrl = this.configService.get<string>('PAYTR_BASE_URL') || 'https://www.paytr.com';
    }

    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const merchantOid = request.conversationId;
            const userBasket = Buffer.from(
                JSON.stringify([
                    [request.description, request.amount.toFixed(2), 1],
                ])
            ).toString('base64');

            const paytrToken = this.generatePaytrToken(
                merchantOid,
                request.userEmail,
                request.amount,
                userBasket,
                request.callbackUrl
            );

            const formData = new URLSearchParams({
                merchant_id: this.merchantId,
                user_ip: '85.34.78.112',
                merchant_oid: merchantOid,
                email: request.userEmail,
                payment_amount: (request.amount * 100).toString(),
                paytr_token: paytrToken,
                user_basket: userBasket,
                debug_on: this.configService.get('NODE_ENV') === 'development' ? '1' : '0',
                no_installment: '0',
                max_installment: '9',
                user_name: request.userName,
                user_address: 'Türkiye',
                user_phone: request.userPhone || '5555555555',
                merchant_ok_url: request.callbackUrl,
                merchant_fail_url: request.callbackUrl,
                timeout_limit: '30',
                currency: request.currency === 'TRY' ? 'TL' : request.currency,
                test_mode: this.configService.get('NODE_ENV') === 'development' ? '1' : '0',
            });

            const response = await fetch(`${this.baseUrl}/odeme/api/get-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const result = await response.json();

            if (result.status === 'success') {
                return {
                    success: true,
                    paymentUrl: `${this.baseUrl}/odeme/guvenli/${result.token}`,
                    token: result.token,
                    providerResponse: result,
                };
            }

            return {
                success: false,
                errorMessage: result.reason || 'PayTR ödeme başlatılamadı',
                providerResponse: result,
            };
        } catch (error) {
            this.logger.error('PayTR payment creation failed', error);
            return {
                success: false,
                errorMessage: error.message,
            };
        }
    }

    async verifyPayment(token: string, conversationId: string): Promise<PaymentVerification> {
        try {
            // PayTR webhook üzerinden doğrulama yapılır
            // Bu method webhook callback'inde kullanılır
            return {
                success: true,
                status: 'COMPLETED',
                transactionId: conversationId,
            };
        } catch (error) {
            this.logger.error('PayTR payment verification failed', error);
            return {
                success: false,
                status: 'FAILED',
                errorMessage: error.message,
            };
        }
    }

    verifyWebhook(postData: any): boolean {
        const hash = crypto
            .createHmac('sha256', this.merchantSalt)
            .update(postData.merchant_oid + this.merchantSalt + postData.status + postData.total_amount)
            .digest('base64');

        return hash === postData.hash;
    }

    async refundPayment(transactionId: string, amount: number): Promise<boolean> {
        try {
            const formData = new URLSearchParams({
                merchant_id: this.merchantId,
                merchant_oid: transactionId,
                return_amount: (amount * 100).toString(),
            });

            const response = await fetch(`${this.baseUrl}/odeme/iade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const result = await response.json();
            return result.status === 'success';
        } catch (error) {
            this.logger.error('PayTR refund failed', error);
            return false;
        }
    }

    private generatePaytrToken(
        merchantOid: string,
        email: string,
        amount: number,
        userBasket: string,
        callbackUrl: string
    ): string {
        const hashStr = `${this.merchantId}${email}${merchantOid}${(amount * 100).toString()}${userBasket}0930${callbackUrl}${callbackUrl}${this.merchantSalt}`;

        return crypto
            .createHmac('sha256', this.merchantKey)
            .update(hashStr)
            .digest('base64');
    }
}
