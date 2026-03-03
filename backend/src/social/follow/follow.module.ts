import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { Follow, FollowRequest } from '../entities';
import { User } from '../../users/entities/user.entity';
import { NotificationsModule } from '../../notifications/notifications.module';
import { PrivacyModule } from '../privacy/privacy.module';
import { SocialFeedModule } from '../social-feed/social-feed.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Follow, FollowRequest, User]),
        NotificationsModule,
        forwardRef(() => PrivacyModule),
        forwardRef(() => SocialFeedModule),
    ],
    controllers: [FollowController],
    providers: [FollowService],
    exports: [FollowService],
})
export class FollowModule { }
