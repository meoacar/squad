import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PaymentsService, PaymentProvider } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async createPayment(
        @CurrentUser() user: any,
        @Body() createPaymentDto: CreatePaymentDto,
        @Query('provider') provider: string = 'IYZICO',
    ) {
        const paymentProvider = provider.toUpperCase() === 'PAYTR'
            ? PaymentProvider.PAYTR
            : PaymentProvider.IYZICO;

        return this.paymentsService.createPayment(
            user.id,
            user.email,
            user.username,
            createPaymentDto,
            paymentProvider,
        );
    }

    @Get('verify')
    @Public()
    async verifyPayment(
        @Query('token') token: string,
        @Query('conversationId') conversationId: string,
        @Query('provider') provider: string = 'IYZICO',
    ) {
        const paymentProvider = provider.toUpperCase() === 'PAYTR'
            ? PaymentProvider.PAYTR
            : PaymentProvider.IYZICO;

        return this.paymentsService.verifyPayment(token, conversationId, paymentProvider);
    }

    @Post('callback/paytr')
    @Public()
    @HttpCode(HttpStatus.OK)
    async paytrCallback(@Body() body: any) {
        await this.paymentsService.handlePayTRCallback(body);
        return 'OK';
    }

    @Get('my-payments')
    @UseGuards(JwtAuthGuard)
    async getMyPayments(@CurrentUser() user: any) {
        return this.paymentsService.getUserPayments(user.id);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getPayment(@Param('id') id: string) {
        return this.paymentsService.getPaymentById(id);
    }

    @Post(':id/refund')
    @UseGuards(JwtAuthGuard)
    async refundPayment(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body('reason') reason: string,
    ) {
        return this.paymentsService.refundPayment(id, user.id, reason);
    }
}
