export interface PaymentRequest {
    amount: number;
    currency: string;
    description: string;
    userId: string;
    userEmail: string;
    userName: string;
    userPhone?: string;
    callbackUrl: string;
    conversationId: string;
}

export interface PaymentResponse {
    success: boolean;
    paymentUrl?: string;
    token?: string;
    errorMessage?: string;
    providerResponse?: any;
}

export interface PaymentVerification {
    success: boolean;
    status: string;
    amount?: number;
    currency?: string;
    transactionId?: string;
    errorMessage?: string;
}

export interface IPaymentProvider {
    createPayment(request: PaymentRequest): Promise<PaymentResponse>;
    verifyPayment(token: string, conversationId: string): Promise<PaymentVerification>;
    refundPayment(transactionId: string, amount: number): Promise<boolean>;
}
