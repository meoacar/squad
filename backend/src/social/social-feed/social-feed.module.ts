import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialFeedService } from './social-feed.service';
import { SocialFeedController } from './social-feed.controller';
import { ActivityListener } from './listeners/activity.listener';
import {
    Activity,
    ActivityLike,
    ActivityComment,
    Follow,
} from '../entities';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Activity,
            ActivityLike,
            ActivityComment,
            Follow,
        ]),
        NotificationsModule,
    ],
    controllers: [SocialFeedController],
    providers: [SocialFeedService, ActivityListener],
    exports: [SocialFeedService],
})
export class SocialFeedModule { }
