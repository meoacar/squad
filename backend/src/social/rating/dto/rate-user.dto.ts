import { IsInt, Min, Max, IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class RateUserDto {
    @IsUUID()
    rated_user_id: string;

    @IsUUID()
    match_id: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    comment?: string;
}
