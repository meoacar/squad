import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SendNotificationDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    body: string;

    @IsString()
    @IsOptional()
    url?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    userIds?: string[];
}
