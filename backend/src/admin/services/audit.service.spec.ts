import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '../entities/audit-log.entity';

describe('AuditService', () => {
    let service: AuditService;
    let auditLogRepository: any;

    const mockAuditLog = {
        id: 'log-123',
        admin_id: 'admin-123',
        action_type: 'USER_SUSPENDED',
        target_type: 'user',
        target_id: 'user-123',
        details: { days: 7, reason: 'Violation' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date(),
    };

    beforeEach(async () => {
        const mockAuditLogRepository = {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn(),
                getMany: jest.fn(),
            })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditService,
                {
                    provide: getRepositoryToken(AuditLog),
                    useValue: mockAuditLogRepository,
                },
            ],
        }).compile();

        service = module.get<AuditService>(AuditService);
        auditLogRepository = module.get(getRepositoryToken(AuditLog));

        jest.clearAllMocks();
    });

    describe('log', () => {
        it('should create and save audit log', async () => {
            const logData = {
                adminId: 'admin-123',
                action: 'USER_SUSPENDED',
                targetType: 'user',
                targetId: 'user-123',
                details: { days: 7, reason: 'Violation' },
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
            };

            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            const result = await service.log(logData);

            expect(auditLogRepository.create).toHaveBeenCalledWith({
                admin_id: logData.adminId,
                action_type: logData.action,
                target_type: logData.targetType,
                target_id: logData.targetId,
                details: logData.details,
                ip_address: logData.ipAddress,
                user_agent: logData.userAgent,
            });
            expect(auditLogRepository.save).toHaveBeenCalled();
            expect(result).toEqual(mockAuditLog);
        });

        it('should handle optional fields', async () => {
            const logData = {
                adminId: 'admin-123',
                action: 'USER_VIEWED',
                targetType: 'user',
            };

            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            await service.log(logData);

            expect(auditLogRepository.create).toHaveBeenCalledWith({
                admin_id: logData.adminId,
                action_type: logData.action,
                target_type: logData.targetType,
                target_id: undefined,
                details: undefined,
                ip_address: undefined,
                user_agent: undefined,
            });
        });

        it('should log different action types', async () => {
            const actions = [
                'USER_SUSPENDED',
                'USER_BANNED',
                'POST_DELETED',
                'REPORT_RESOLVED',
                'PREMIUM_ASSIGNED',
            ];

            auditLogRepository.create.mockReturnValue(mockAuditLog);
            auditLogRepository.save.mockResolvedValue(mockAuditLog);

            for (const action of actions) {
                await service.log({
                    adminId: 'admin-123',
                    action,
                    targetType: 'user',
                });

                expect(auditLogRepository.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        action_type: action,
                    }),
                );
            }
        });
    });

    describe('getLogs', () => {
        it('should return paginated audit logs', async () => {
            const filters = {
                page: 1,
                limit: 25,
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[mockAuditLog], 1]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getLogs(filters);

            expect(result).toEqual([[mockAuditLog], 1]);
            expect(queryBuilder.skip).toHaveBeenCalledWith(0);
            expect(queryBuilder.take).toHaveBeenCalledWith(25);
        });

        it('should filter by admin ID', async () => {
            const filters = {
                adminId: 'admin-123',
                page: 1,
                limit: 25,
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getLogs(filters);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith('log.admin_id = :adminId', {
                adminId: 'admin-123',
            });
        });

        it('should filter by action type', async () => {
            const filters = {
                actionType: 'USER_SUSPENDED',
                page: 1,
                limit: 25,
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getLogs(filters);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                'log.action_type = :actionType',
                {
                    actionType: 'USER_SUSPENDED',
                },
            );
        });

        it('should filter by date range', async () => {
            const filters = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                page: 1,
                limit: 25,
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getLogs(filters);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                'log.created_at BETWEEN :start AND :end',
                {
                    start: filters.startDate,
                    end: filters.endDate,
                },
            );
        });

        it('should order by created_at DESC', async () => {
            const filters = {
                page: 1,
                limit: 25,
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getLogs(filters);

            expect(queryBuilder.orderBy).toHaveBeenCalledWith('log.created_at', 'DESC');
        });

        it('should join admin relation', async () => {
            const filters = {
                page: 1,
                limit: 25,
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getLogs(filters);

            expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('log.admin', 'admin');
        });

        it('should handle multiple filters', async () => {
            const filters = {
                adminId: 'admin-123',
                actionType: 'USER_SUSPENDED',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                page: 2,
                limit: 50,
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getLogs(filters);

            expect(queryBuilder.andWhere).toHaveBeenCalledTimes(3);
            expect(queryBuilder.skip).toHaveBeenCalledWith(50);
            expect(queryBuilder.take).toHaveBeenCalledWith(50);
        });

        it('should work without pagination', async () => {
            const filters = {};

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[mockAuditLog], 1]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getLogs(filters);

            expect(queryBuilder.skip).not.toHaveBeenCalled();
            expect(queryBuilder.take).not.toHaveBeenCalled();
            expect(result).toEqual([[mockAuditLog], 1]);
        });
    });

    describe('exportLogs', () => {
        it('should return all logs without pagination', async () => {
            const filters = {};

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([mockAuditLog]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.exportLogs(filters);

            expect(result).toEqual([mockAuditLog]);
            expect(queryBuilder.getMany).toHaveBeenCalled();
        });

        it('should filter by admin ID', async () => {
            const filters = {
                adminId: 'admin-123',
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.exportLogs(filters);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith('log.admin_id = :adminId', {
                adminId: 'admin-123',
            });
        });

        it('should filter by action type', async () => {
            const filters = {
                actionType: 'USER_BANNED',
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.exportLogs(filters);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                'log.action_type = :actionType',
                {
                    actionType: 'USER_BANNED',
                },
            );
        });

        it('should filter by date range', async () => {
            const filters = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.exportLogs(filters);

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                'log.created_at BETWEEN :start AND :end',
                {
                    start: filters.startDate,
                    end: filters.endDate,
                },
            );
        });

        it('should order by created_at DESC', async () => {
            const filters = {};

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.exportLogs(filters);

            expect(queryBuilder.orderBy).toHaveBeenCalledWith('log.created_at', 'DESC');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty results', async () => {
            const filters = {
                page: 1,
                limit: 25,
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getLogs(filters);

            expect(result).toEqual([[], 0]);
        });

        it('should handle large page numbers', async () => {
            const filters = {
                page: 100,
                limit: 25,
            };

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            };
            auditLogRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getLogs(filters);

            expect(queryBuilder.skip).toHaveBeenCalledWith(2475); // (100-1) * 25
        });
    });
});
