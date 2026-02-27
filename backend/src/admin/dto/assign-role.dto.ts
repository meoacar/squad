import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../auth/enums/admin-role.enum';

export class AssignRoleDto {
    @ApiProperty({
        enum: AdminRole,
        description: 'Admin role to assign',
        example: AdminRole.MODERATOR,
    })
    @IsEnum(AdminRole)
    role: AdminRole;

    @ApiProperty({
        description: 'Optional expiration date for the role',
        example: '2024-12-31T23:59:59Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}
