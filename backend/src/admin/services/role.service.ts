import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRole as AdminRoleEntity } from '../entities/admin-role.entity';
import { AdminRole } from '../../auth/enums/admin-role.enum';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(AdminRoleEntity)
        private adminRoleRepo: Repository<AdminRoleEntity>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async assignRole(
        userId: string,
        role: AdminRole,
        grantedBy: string,
        expiresAt?: Date,
    ): Promise<AdminRoleEntity> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Deactivate existing roles for this user
        await this.adminRoleRepo.update(
            { user_id: userId },
            { expires_at: new Date() },
        );

        const adminRole = this.adminRoleRepo.create({
            user_id: userId,
            role,
            granted_by: grantedBy,
            expires_at: expiresAt,
        });

        return await this.adminRoleRepo.save(adminRole);
    }

    async getUserRole(userId: string): Promise<AdminRole | null> {
        const adminRole = await this.adminRoleRepo.findOne({
            where: { user_id: userId },
            order: { granted_at: 'DESC' },
        });

        if (!adminRole) {
            return null;
        }

        // Check if role has expired
        if (adminRole.expires_at && adminRole.expires_at < new Date()) {
            return null;
        }

        return adminRole.role as AdminRole;
    }

    async revokeRole(userId: string): Promise<void> {
        await this.adminRoleRepo.update(
            { user_id: userId },
            { expires_at: new Date() },
        );
    }

    async getAllAdminUsers(): Promise<AdminRoleEntity[]> {
        return await this.adminRoleRepo
            .createQueryBuilder('role')
            .leftJoinAndSelect('role.user', 'user')
            .where('role.expires_at IS NULL OR role.expires_at > :now', {
                now: new Date(),
            })
            .orderBy('role.granted_at', 'DESC')
            .getMany();
    }
}
