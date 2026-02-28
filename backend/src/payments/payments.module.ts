import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { IyzicoProvider } from './providers/iyzico.provider';
import { PayTRProvider } from './providers/paytr.provider';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment]),
        ConfigModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService, IyzicoProvider, PayTRProvider],
    exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule { }
