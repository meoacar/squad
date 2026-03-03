import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClanService } from './clan.service';
import { ClanController } from './clan.controller';
import {
    Clan,
    ClanMember,
    ClanInvitation,
    ClanAnnouncement,
} from '../entities';
import { User } from '../../users/entities/user.entity';
import { NotificationsModule } from '../../notifications/notifications.module';
import { SocialFeedModule } from '../social-feed/social-feed.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Clan,
            ClanMember,
            ClanInvitation,
            ClanAnnouncement,
            User,
        ]),
        NotificationsModule,
        forwardRef(() => SocialFeedModule),
    ],
    controllers: [ClanController],
    providers: [ClanService],
    exports: [ClanService],
})
export class ClanModule { }
