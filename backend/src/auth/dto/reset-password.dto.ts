import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        example: 'abc123def456',
        description: 'Password reset token',
    })
    @IsString()
    token: string;

    @ApiProperty({
        example: 'NewSecurePass123!',
        description: 'New password (min 8 characters, at least 1 uppercase, 1 number)',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least 1 uppercase letter and 1 number',
    })
    password: string;
}
