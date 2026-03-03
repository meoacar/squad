import { IsEnum, IsNotEmpty, IsObject } from 'class-validator';
import { ActivityType } from '../../entities/activity.entity';

export class CreateActivityDto {
    @IsEnum(ActivityType)
    @IsNotEmpty()
    type: ActivityType;

    @IsObject()
    @IsNotEmpty()
    data: Record<string, any>;
}
