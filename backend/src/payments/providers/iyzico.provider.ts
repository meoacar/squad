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
export class IyzicoProvider implements IPaymentProvider {
    private readonly logger = new Logger(IyzicoProvider.name);
    private readonly apiKey: string;
    private readonly secretKey: string;
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('IYZICO_API_KEY') || 'your_iyzico_api_key';
        this.secretKey = this.configService.get<string>('IYZICO_SECRET_KEY') || 'your_iyzico_secret_key';
        this.baseUrl = this.configService.get<string>('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';
    }

    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const requestBody = {
                locale: 'tr',
                conversationId: request.conversationId,
                price: request.amount.toFixed(2),
                paidPrice: request.amount.toFixed(2),
                currency: request.currency,
                basketId: request.conversationId,
                paymentGroup: 'PRODUCT',
                callbackUrl: request.callbackUrl,
                enabledInstallments: [1, 2, 3, 6, 9],
                buyer: {
                    id: request.userId,
                    name: request.userName.split(' ')[0] || 'Ad',
                    surname: request.userName.split(' ')[1] || 'Soyad',
                    email: request.userEmail,
                    identityNumber: '11111111111',
                    registrationAddress: 'Türkiye',
                    city: 'Istanbul',
                    country: 'Turkey',
                    ip: '85.34.78.112',
                },
                shippingAddress: {
                    contactName: request.userName,
                    city: 'Istanbul',
                    country: 'Turkey',
                    address: 'Türkiye',
                },
                billingAddress: {
                    contactName: request.userName,
                    city: 'Istanbul',
                    country: 'Turkey',
                    address: 'Türkiye',
                },
                basketItems: [
                    {
                        id: '1',
                        name: request.description,
                        category1: 'Premium',
                        itemType: 'VIRTUAL',
                        price: request.amount.toFixed(2),
                    },
                ],
            };

            const response = await this.makeRequest('/payment/iyzipos/checkoutform/initialize/auth/ecom', requestBody);

            if (response.status === 'success') {
                return {
                    success: true,
                    paymentUrl: response.paymentPageUrl,
                    token: response.token,
                    providerResponse: response,
                };
            }

            return {
                success: false,
                errorMessage: response.errorMessage || 'İyzico ödeme başlatılamadı',
                providerResponse: response,
            };
        } catch (error) {
            this.logger.error('İyzico payment creation failed', error);
            return {
                success: false,
                errorMessage: error.message,
            };
        }
    }

    async verifyPayment(token: string, conversationId: string): Promise<PaymentVerification> {
        try {
            const requestBody = {
                locale: 'tr',
                conversationId,
                token,
            };

            const response = await this.makeRequest('/payment/iyzipos/checkoutform/auth/ecom/detail', requestBody);

            if (response.status === 'success' && response.paymentStatus === 'SUCCESS') {
                return {
                    success: true,
                    status: 'COMPLETED',
                    amount: parseFloat(response.paidPrice),
                    currency: response.currency,
                    transactionId: response.paymentId,
                };
            }

            return {
                success: false,
                status: 'FAILED',
                errorMessage: response.errorMessage || 'Ödeme doğrulanamadı',
            };
        } catch (error) {
            this.logger.error('İyzico payment verification failed', error);
            return {
                success: false,
                status: 'FAILED',
                errorMessage: error.message,
            };
        }
    }

    async refundPayment(transactionId: string, amount: number): Promise<boolean> {
        try {
            const requestBody = {
                locale: 'tr',
                conversationId: `refund-${Date.now()}`,
                paymentTransactionId: transactionId,
                price: amount.toFixed(2),
                currency: 'TRY',
            };

            const response = await this.makeRequest('/payment/refund', requestBody);
            return response.status === 'success';
        } catch (error) {
            this.logger.error('İyzico refund failed', error);
            return false;
        }
    }

    private async makeRequest(endpoint: string, body: any): Promise<any> {
        const randomString = this.generateRandomString();
        const authString = this.generateAuthString(endpoint, body, randomString);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authString,
                'x-iyzi-rnd': randomString,
            },
            body: JSON.stringify(body),
        });

        return response.json();
    }

    private generateAuthString(endpoint: string, body: any, randomString: string): string {
        const dataToHash = randomString + JSON.stringify(body);
        const hash = crypto
            .createHmac('sha256', this.secretKey)
            .update(dataToHash)
            .digest('base64');

        return `IYZWS ${this.apiKey}:${hash}`;
    }

    private generateRandomString(): string {
        return crypto.randomBytes(16).toString('hex');
    }
}
