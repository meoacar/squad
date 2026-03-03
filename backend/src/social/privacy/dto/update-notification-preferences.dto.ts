import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
    @IsOptional()
    @IsBoolean()
    email_messages?: boolean;

    @IsOptional()
    @IsBoolean()
    email_follow?: boolean;

    @IsOptional()
    @IsBoolean()
    email_clan_invites?: boolean;

    @IsOptional()
    @IsBoolean()
    email_activity_interactions?: boolean;

    @IsOptional()
    @IsBoolean()
    push_messages?: boolean;

    @IsOptional()
    @IsBoolean()
    push_follow?: boolean;

    @IsOptional()
    @IsBoolean()
    push_clan_invites?: boolean;

    @IsOptional()
    @IsBoolean()
    push_activity_interactions?: boolean;
}
