import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class KeysDto {
    @IsString()
    @IsNotEmpty()
    p256dh: string;

    @IsString()
    @IsNotEmpty()
    auth: string;
}

export class SubscribeDto {
    @IsString()
    @IsNotEmpty()
    endpoint: string;

    @ValidateNested()
    @Type(() => KeysDto)
    keys: KeysDto;
}
