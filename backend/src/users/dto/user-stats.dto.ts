import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
    @ApiProperty({ description: 'Total number of posts created by user' })
    totalPosts: number;

    @ApiProperty({ description: 'Number of active posts' })
    activePosts: number;

    @ApiProperty({ description: 'Total number of applications made by user' })
    totalApplications: number;

    @ApiProperty({ description: 'Number of accepted applications' })
    acceptedApplications: number;

    @ApiProperty({ description: 'Number of users who favorited user posts' })
    favoritedBy: number;

    @ApiProperty({ description: 'Number of incoming applications to user posts' })
    incomingApplications: number;
}
