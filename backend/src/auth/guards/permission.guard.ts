import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PERMISSIONS } from '../constants/permissions';
import { AdminRole } from '../enums/admin-role.enum';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermission = this.reflector.getAllAndOverride<string>(
            PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermission) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return false;
        }

        return this.hasPermission(user, requiredPermission);
    }

    private hasPermission(user: any, permission: string): boolean {
        const role = user.role as AdminRole;
        const userPermissions = PERMISSIONS[role] || [];

        // Super admin has all permissions
        if (userPermissions.includes('*')) {
            return true;
        }

        // Check if user has the specific permission
        return userPermissions.includes(permission);
    }
}
