import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class ReportCommentDto {
    @IsUUID()
    rating_id: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}
