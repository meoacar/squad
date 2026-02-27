import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AssignBoostDto {
    @ApiProperty({
        example: 24,
        description: 'Number of hours for boost',
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    hours: number;
}
