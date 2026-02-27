import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditService } from './services/audit.service';
import { AnalyticsService } from './services/analytics.service';
import { MetricsService } from './services/metrics.service';
import { RoleService } from './services/role.service';
import { QueueService } from './services/queue.service';
import { SchedulerService } from './services/scheduler.service';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Report } from '../reports/entities/report.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Setting } from '../settings/entities/setting.entity';
import { Page } from '../pages/entities/page.entity';
import { MenuItem } from '../pages/entities/menu-item.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AdminRole } from './entities/admin-role.entity';
import { SystemMetric } from './entities/system-metric.entity';
import { DailyStat } from './entities/daily-stat.entity';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AdminProcessor } from './queues/admin.processor';
import { AnalyticsProcessor } from './queues/analytics.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Post,
            Report,
            Payment,
            Setting,
            Page,
            MenuItem,
            AuditLog,
            AdminRole,
            SystemMetric,
            DailyStat,
        ]),
        BullModule.registerQueue(
            {
                name: 'admin',
            },
            {
                name: 'analytics',
            },
        ),
        ScheduleModule.forRoot(),
    ],
    providers: [
        AdminService,
        AuditService,
        AnalyticsService,
        MetricsService,
        RoleService,
        QueueService,
        SchedulerService,
        PermissionGuard,
        AdminProcessor,
        AnalyticsProcessor,
    ],
    controllers: [AdminController],
    exports: [
        AdminService,
        AuditService,
        AnalyticsService,
        MetricsService,
        RoleService,
        QueueService,
    ],
})
export class AdminModule { }
