import { IsUUID, IsNotEmpty } from 'class-validator';

export class InviteMemberDto {
    @IsUUID()
    @IsNotEmpty()
    invitee_id: string;
}
