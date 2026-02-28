import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { IyzicoProvider } from './providers/iyzico.provider';
import { PayTRProvider } from './providers/paytr.provider';
import { IPaymentProvider } from './interfaces/payment-provider.interface';

export enum PaymentProvider {
    IYZICO = 'IYZICO',
    PAYTR = 'PAYTR',
}

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly providers: Map<PaymentProvider, IPaymentProvider>;

    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        private iyzicoProvider: IyzicoProvider,
        private paytrProvider: PayTRProvider,
        private configService: ConfigService,
    ) {
        this.providers = new Map<PaymentProvider, IPaymentProvider>([
            [PaymentProvider.IYZICO, this.iyzicoProvider as IPaymentProvider],
            [PaymentProvider.PAYTR, this.paytrProvider as IPaymentProvider],
        ]);
    }

    async createPayment(
        userId: string,
        userEmail: string,
        userName: string,
        createPaymentDto: CreatePaymentDto,
        provider: PaymentProvider = PaymentProvider.IYZICO,
    ) {
        const conversationId = `${Date.now()}-${userId}`;
        const callbackUrl = createPaymentDto.callbackUrl ||
            `${this.configService.get('FRONTEND_URL')}/payment/callback`;

        // Create payment record
        const payment = this.paymentRepository.create({
            user_id: userId,
            type: createPaymentDto.type,
            amount: createPaymentDto.amount,
            currency: createPaymentDto.currency || 'TRY',
            status: PaymentStatus.PENDING,
            payment_method: 'CREDIT_CARD' as any,
            payment_provider: provider,
            description: createPaymentDto.description,
            metadata: {
                conversationId,
                provider,
            },
        });

        await this.paymentRepository.save(payment);

        try {
            const paymentProvider = this.providers.get(provider);
            if (!paymentProvider) {
                throw new BadRequestException('Geçersiz ödeme sağlayıcısı');
            }

            const response = await paymentProvider.createPayment({
                amount: createPaymentDto.amount,
                currency: createPaymentDto.currency || 'TRY',
                description: createPaymentDto.description || `${createPaymentDto.type} Üyelik`,
                userId,
                userEmail,
                userName,
                callbackUrl,
                conversationId,
            });

            if (response.success) {
                payment.metadata = {
                    ...payment.metadata,
                    token: response.token,
                    providerResponse: response.providerResponse,
                };
                await this.paymentRepository.save(payment);

                return {
                    paymentId: payment.id,
                    paymentUrl: response.paymentUrl || '',
                    token: response.token || '',
                };
            }

            payment.status = PaymentStatus.FAILED;
            payment.metadata = {
                ...payment.metadata,
                error: response.errorMessage,
            };
            await this.paymentRepository.save(payment);

            throw new BadRequestException(response.errorMessage || 'Ödeme başlatılamadı');
        } catch (error) {
            this.logger.error('Payment creation failed', error);
            payment.status = PaymentStatus.FAILED;
            await this.paymentRepository.save(payment);
            throw error;
        }
    }

    async verifyPayment(token: string, conversationId: string, provider: PaymentProvider) {
        const payment = await this.paymentRepository.findOne({
            where: {
                metadata: {
                    conversationId,
                } as any,
            },
        });

        if (!payment) {
            throw new NotFoundException('Ödeme bulunamadı');
        }

        const paymentProvider = this.providers.get(provider);
        if (!paymentProvider) {
            throw new BadRequestException('Geçersiz ödeme sağlayıcısı');
        }

        const verification = await paymentProvider.verifyPayment(token, conversationId);

        if (verification.success && verification.status === 'COMPLETED') {
            payment.status = PaymentStatus.COMPLETED;
            payment.transaction_id = verification.transactionId || '';
            payment.completed_at = new Date();
            await this.paymentRepository.save(payment);

            return {
                success: true,
                payment,
            };
        }

        payment.status = PaymentStatus.FAILED;
        payment.metadata = {
            ...payment.metadata,
            verificationError: verification.errorMessage,
        };
        await this.paymentRepository.save(payment);

        return {
            success: false,
            message: verification.errorMessage || 'Ödeme doğrulanamadı',
        };
    }

    async handlePayTRCallback(postData: any) {
        const isValid = this.paytrProvider.verifyWebhook(postData);

        if (!isValid) {
            throw new BadRequestException('Geçersiz webhook imzası');
        }

        const payment = await this.paymentRepository.findOne({
            where: {
                metadata: {
                    conversationId: postData.merchant_oid,
                } as any,
            },
        });

        if (!payment) {
            throw new NotFoundException('Ödeme bulunamadı');
        }

        if (postData.status === 'success') {
            payment.status = PaymentStatus.COMPLETED;
            payment.transaction_id = postData.merchant_oid;
            payment.completed_at = new Date();
        } else {
            payment.status = PaymentStatus.FAILED;
        }

        payment.metadata = {
            ...payment.metadata,
            webhookData: postData,
        };

        await this.paymentRepository.save(payment);

        return payment;
    }

    async refundPayment(paymentId: string, refundedBy: string, reason: string) {
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new NotFoundException('Ödeme bulunamadı');
        }

        if (payment.status !== PaymentStatus.COMPLETED) {
            throw new BadRequestException('Sadece tamamlanmış ödemeler iade edilebilir');
        }

        const provider = this.providers.get(payment.payment_provider as any);
        if (!provider) {
            throw new BadRequestException('Geçersiz ödeme sağlayıcısı');
        }
        const success = await provider.refundPayment(payment.transaction_id || '', payment.amount);

        if (success) {
            payment.status = PaymentStatus.REFUNDED;
            payment.refunded_at = new Date();
            payment.refunded_by = refundedBy;
            payment.refund_reason = reason;
            await this.paymentRepository.save(payment);

            return {
                success: true,
                payment,
            };
        }

        throw new BadRequestException('İade işlemi başarısız');
    }

    async getUserPayments(userId: string) {
        return this.paymentRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
    }

    async getPaymentById(paymentId: string) {
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new NotFoundException('Ödeme bulunamadı');
        }

        return payment;
    }
}
