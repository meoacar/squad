import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ContactStatus } from '../entities/contact.entity';

export class UpdateContactDto {
    @IsEnum(ContactStatus)
    @IsOptional()
    status?: ContactStatus;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    admin_reply?: string;
}
