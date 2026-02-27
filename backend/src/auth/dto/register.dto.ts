import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    Matches,
    IsEnum,
} from 'class-validator';
import { Region, Language } from '../../common/enums';

export class RegisterDto {
    @ApiProperty({
        example: 'john_doe',
        description: 'Username (3-20 characters, alphanumeric and underscore only)',
        minLength: 3,
        maxLength: 20,
    })
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username can only contain letters, numbers, and underscores',
    })
    username: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'Email address',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'SecurePass123!',
        description:
            'Password (min 8 characters, at least 1 uppercase, 1 number)',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
        message:
            'Password must contain at least 1 uppercase letter and 1 number',
    })
    password: string;

    @ApiProperty({
        example: Region.TR,
        enum: Region,
        description: 'User region',
    })
    @IsEnum(Region)
    region: Region;

    @ApiProperty({
        example: Language.TR,
        enum: Language,
        description: 'Preferred language',
    })
    @IsEnum(Language)
    language: Language;
}
