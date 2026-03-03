import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CommentActivityDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    content: string;
}
