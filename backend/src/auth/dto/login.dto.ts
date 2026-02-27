import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'Email address',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'SecurePass123!',
        description: 'Password',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    password: string;
}
