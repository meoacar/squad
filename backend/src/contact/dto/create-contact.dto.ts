import { IsString, IsEmail, IsNotEmpty, MaxLength, IsOptional, IsArray } from 'class-validator';

export class CreateContactDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    subject?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    message: string;

    @IsArray()
    @IsOptional()
    attachments?: string[];
}
