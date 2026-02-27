import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RoleService } from './role.service';
import { AdminRole as AdminRoleEntity } from '../entities/admin-role.entity';
import { AdminRole } from '../../auth/enums/admin-role.enum';
import { User } from '../../users/entities/user.entity';

describe('RoleService', () => {
    let service: RoleService;
    let adminRoleRepository: any;
    let userRepository: any;

    const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
    };

    const mockAdminRole = {
        id: 'role-123',
        user_id: 'user-123',
        role: AdminRole.ADMIN,
        granted_by: 'super-admin-123',
        granted_at: new Date(),
        expires_at: null,
    };

    beforeEach(async () => {
        const mockAdminRoleRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            })),
        };

        const mockUserRepository = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                {
                    provide: getRepositoryToken(AdminRoleEntity),
                    useValue: mockAdminRoleRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
            ],
        }).compile();

        service = module.get<RoleService>(RoleService);
        adminRoleRepository = module.get(getRepositoryToken(AdminRoleEntity));
        userRepository = module.get(getRepositoryToken(User));

        jest.clearAllMocks();
    });

    describe('assignRole', () => {
        it('should assign role to user', async () => {
            userRepository.findOne.mockResolvedValue(mockUser);
            adminRoleRepository.update.mockResolvedValue({});
            adminRoleRepository.create.mockReturnValue(mockAdminRole);
            adminRoleRepository.save.mockResolvedValue(mockAdminRole);

            const result = await service.assignRole(
                'user-123',
                AdminRole.ADMIN,
                'super-admin-123',
            );

            expect(result).toEqual(mockAdminRole);
            expect(adminRoleRepository.create).toHaveBeenCalledWith({
                user_id: 'user-123',
                role: AdminRole.ADMIN,
                granted_by: 'super-admin-123',
                expires_at: undefined,
            });
            expect(adminRoleRepository.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if user not found', async () => {
            userRepository.findOne.mockResolvedValue(null);

            await expect(
                service.assignRole('invalid-id', AdminRole.ADMIN, 'super-admin-123'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should deactivate existing roles before assigning new one', async () => {
            userRepository.findOne.mockResolvedValue(mockUser);
            adminRoleRepository.update.mockResolvedValue({});
            adminRoleRepository.create.mockReturnValue(mockAdminRole);
            adminRoleRepository.save.mockResolvedValue(mockAdminRole);

            await service.assignRole('user-123', AdminRole.ADMIN, 'super-admin-123');

            expect(adminRoleRepository.update).toHaveBeenCalledWith(
                { user_id: 'user-123' },
                { expires_at: expect.any(Date) },
            );
        });

        it('should assign role with expiration date', async () => {
            userRepository.findOne.mockResolvedValue(mockUser);
            adminRoleRepository.update.mockResolvedValue({});
            adminRoleRepository.create.mockReturnValue(mockAdminRole);
            adminRoleRepository.save.mockResolvedValue(mockAdminRole);

            const expiresAt = new Date('2024-12-31');
            await service.assignRole('user-123', AdminRole.ADMIN, 'super-admin-123', expiresAt);

            expect(adminRoleRepository.create).toHaveBeenCalledWith({
                user_id: 'user-123',
                role: AdminRole.ADMIN,
                granted_by: 'super-admin-123',
                expires_at: expiresAt,
            });
        });

        it('should assign different role types', async () => {
            userRepository.findOne.mockResolvedValue(mockUser);
            adminRoleRepository.update.mockResolvedValue({});
            adminRoleRepository.create.mockReturnValue(mockAdminRole);
            adminRoleRepository.save.mockResolvedValue(mockAdminRole);

            const roles = [
                AdminRole.SUPER_ADMIN,
                AdminRole.ADMIN,
                AdminRole.MODERATOR,
                AdminRole.VIEWER,
            ];

            for (const role of roles) {
                await service.assignRole('user-123', role, 'super-admin-123');

                expect(adminRoleRepository.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        role,
                    }),
                );
            }
        });
    });

    describe('getUserRole', () => {
        it('should return user role', async () => {
            adminRoleRepository.findOne.mockResolvedValue(mockAdminRole);

            const result = await service.getUserRole('user-123');

            expect(result).toBe(AdminRole.ADMIN);
            expect(adminRoleRepository.findOne).toHaveBeenCalledWith({
                where: { user_id: 'user-123' },
                order: { granted_at: 'DESC' },
            });
        });

        it('should return null if user has no role', async () => {
            adminRoleRepository.findOne.mockResolvedValue(null);

            const result = await service.getUserRole('user-123');

            expect(result).toBeNull();
        });

        it('should return null if role has expired', async () => {
            const expiredRole = {
                ...mockAdminRole,
                expires_at: new Date('2020-01-01'),
            };
            adminRoleRepository.findOne.mockResolvedValue(expiredRole);

            const result = await service.getUserRole('user-123');

            expect(result).toBeNull();
        });

        it('should return role if not expired', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            const validRole = {
                ...mockAdminRole,
                expires_at: futureDate,
            };
            adminRoleRepository.findOne.mockResolvedValue(validRole);

            const result = await service.getUserRole('user-123');

            expect(result).toBe(AdminRole.ADMIN);
        });

        it('should return role if expires_at is null', async () => {
            const permanentRole = {
                ...mockAdminRole,
                expires_at: null,
            };
            adminRoleRepository.findOne.mockResolvedValue(permanentRole);

            const result = await service.getUserRole('user-123');

            expect(result).toBe(AdminRole.ADMIN);
        });

        it('should get most recent role', async () => {
            adminRoleRepository.findOne.mockResolvedValue(mockAdminRole);

            await service.getUserRole('user-123');

            expect(adminRoleRepository.findOne).toHaveBeenCalledWith({
                where: { user_id: 'user-123' },
                order: { granted_at: 'DESC' },
            });
        });
    });

    describe('revokeRole', () => {
        it('should revoke user role by setting expires_at', async () => {
            adminRoleRepository.update.mockResolvedValue({});

            await service.revokeRole('user-123');

            expect(adminRoleRepository.update).toHaveBeenCalledWith(
                { user_id: 'user-123' },
                { expires_at: expect.any(Date) },
            );
        });

        it('should set expires_at to current date', async () => {
            adminRoleRepository.update.mockResolvedValue({});

            const beforeRevoke = new Date();
            await service.revokeRole('user-123');
            const afterRevoke = new Date();

            const updateCall = adminRoleRepository.update.mock.calls[0];
            const expiresAt = updateCall[1].expires_at;

            expect(expiresAt.getTime()).toBeGreaterThanOrEqual(beforeRevoke.getTime());
            expect(expiresAt.getTime()).toBeLessThanOrEqual(afterRevoke.getTime());
        });
    });

    describe('getAllAdminUsers', () => {
        it('should return all admin users with active roles', async () => {
            const mockAdminUsers = [mockAdminRole];
            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockAdminUsers),
            };
            adminRoleRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getAllAdminUsers();

            expect(result).toEqual(mockAdminUsers);
            expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('role.user', 'user');
        });

        it('should filter out expired roles', async () => {
            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            adminRoleRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getAllAdminUsers();

            expect(queryBuilder.where).toHaveBeenCalledWith(
                'role.expires_at IS NULL OR role.expires_at > :now',
                {
                    now: expect.any(Date),
                },
            );
        });

        it('should order by granted_at DESC', async () => {
            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            adminRoleRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getAllAdminUsers();

            expect(queryBuilder.orderBy).toHaveBeenCalledWith('role.granted_at', 'DESC');
        });

        it('should join user relation', async () => {
            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            adminRoleRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.getAllAdminUsers();

            expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('role.user', 'user');
        });

        it('should return empty array if no admin users', async () => {
            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            adminRoleRepository.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.getAllAdminUsers();

            expect(result).toEqual([]);
        });
    });

    describe('Edge Cases', () => {
        it('should handle concurrent role assignments', async () => {
            userRepository.findOne.mockResolvedValue(mockUser);
            adminRoleRepository.update.mockResolvedValue({});
            adminRoleRepository.create.mockReturnValue(mockAdminRole);
            adminRoleRepository.save.mockResolvedValue(mockAdminRole);

            const promises = [
                service.assignRole('user-123', AdminRole.ADMIN, 'super-admin-123'),
                service.assignRole('user-123', AdminRole.MODERATOR, 'super-admin-123'),
            ];

            await Promise.all(promises);

            expect(adminRoleRepository.update).toHaveBeenCalledTimes(2);
            expect(adminRoleRepository.save).toHaveBeenCalledTimes(2);
        });

        it('should handle role assignment with past expiration date', async () => {
            userRepository.findOne.mockResolvedValue(mockUser);
            adminRoleRepository.update.mockResolvedValue({});
            adminRoleRepository.create.mockReturnValue(mockAdminRole);
            adminRoleRepository.save.mockResolvedValue(mockAdminRole);

            const pastDate = new Date('2020-01-01');
            await service.assignRole('user-123', AdminRole.ADMIN, 'super-admin-123', pastDate);

            expect(adminRoleRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    expires_at: pastDate,
                }),
            );
        });
    });
});
