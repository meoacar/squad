import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async log(data: {
        adminId: string;
        action: string;
        targetType: string;
        targetId?: string;
        details?: any;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuditLog> {
        const log = this.auditLogRepository.create({
            admin_id: data.adminId,
            action_type: data.action,
            target_type: data.targetType,
            target_id: data.targetId,
            details: data.details,
            ip_address: data.ipAddress,
            user_agent: data.userAgent,
        });

        return await this.auditLogRepository.save(log);
    }

    async getLogs(filters: {
        adminId?: string;
        actionType?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<[AuditLog[], number]> {
        const query = this.auditLogRepository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.admin', 'admin');

        if (filters.adminId) {
            query.andWhere('log.admin_id = :adminId', { adminId: filters.adminId });
        }

        if (filters.actionType) {
            query.andWhere('log.action_type = :actionType', {
                actionType: filters.actionType,
            });
        }

        if (filters.startDate && filters.endDate) {
            query.andWhere('log.created_at BETWEEN :start AND :end', {
                start: filters.startDate,
                end: filters.endDate,
            });
        }

        query.orderBy('log.created_at', 'DESC');

        if (filters.page && filters.limit) {
            query.skip((filters.page - 1) * filters.limit);
            query.take(filters.limit);
        }

        return await query.getManyAndCount();
    }

    async exportLogs(filters: {
        adminId?: string;
        actionType?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<AuditLog[]> {
        const query = this.auditLogRepository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.admin', 'admin');

        if (filters.adminId) {
            query.andWhere('log.admin_id = :adminId', { adminId: filters.adminId });
        }

        if (filters.actionType) {
            query.andWhere('log.action_type = :actionType', {
                actionType: filters.actionType,
            });
        }

        if (filters.startDate && filters.endDate) {
            query.andWhere('log.created_at BETWEEN :start AND :end', {
                start: filters.startDate,
                end: filters.endDate,
            });
        }

        query.orderBy('log.created_at', 'DESC');

        return await query.getMany();
    }
}
