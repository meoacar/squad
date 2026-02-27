import { AdminRole } from '../enums/admin-role.enum';

export const PERMISSIONS = {
    [AdminRole.SUPER_ADMIN]: ['*'], // All permissions
    [AdminRole.ADMIN]: [
        'users:read',
        'users:update',
        'users:suspend',
        'users:ban',
        'posts:read',
        'posts:update',
        'posts:delete',
        'posts:boost',
        'posts:feature',
        'reports:read',
        'reports:resolve',
        'payments:read',
        'payments:refund',
        'analytics:read',
        'audit:read',
        'settings:read',
        'settings:write',
    ],
    [AdminRole.MODERATOR]: [
        'users:read',
        'posts:read',
        'posts:update',
        'reports:read',
        'reports:resolve',
    ],
    [AdminRole.VIEWER]: [
        'users:read',
        'posts:read',
        'reports:read',
        'analytics:read',
    ],
};
