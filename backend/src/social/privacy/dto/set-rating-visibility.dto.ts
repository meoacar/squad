import { IsBoolean } from 'class-validator';

export class SetRatingVisibilityDto {
    @IsBoolean()
    isHidden: boolean;
}
