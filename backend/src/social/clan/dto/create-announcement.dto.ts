import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content: string;
}
