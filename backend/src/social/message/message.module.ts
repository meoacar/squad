import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageGateway } from './message.gateway';
import {
    Message,
    Conversation,
    MessageRead,
    ClanMember,
} from '../entities';
import { User } from '../../users/entities/user.entity';
import { NotificationsModule } from '../../notifications/notifications.module';
import { PrivacyModule } from '../privacy/privacy.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Message,
            Conversation,
            MessageRead,
            ClanMember,
            User,
        ]),
        NotificationsModule,
        forwardRef(() => PrivacyModule),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [MessageController],
    providers: [MessageService, MessageGateway],
    exports: [MessageService, MessageGateway],
})
export class MessageModule { }
