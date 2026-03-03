import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivacyService } from './privacy.service';
import { PrivacyController } from './privacy.controller';
import { Block, NotificationPreferences, Follow } from '../entities';
import { User } from '../../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Block, NotificationPreferences, Follow, User]),
    ],
    controllers: [PrivacyController],
    providers: [PrivacyService],
    exports: [PrivacyService],
})
export class PrivacyModule { }
