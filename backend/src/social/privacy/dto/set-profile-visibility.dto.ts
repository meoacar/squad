import { IsEnum } from 'class-validator';

export enum ProfileVisibility {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
}

export class SetProfileVisibilityDto {
    @IsEnum(ProfileVisibility)
    visibility: ProfileVisibility;
}
