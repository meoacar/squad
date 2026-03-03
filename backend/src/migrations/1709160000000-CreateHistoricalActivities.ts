import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHistoricalActivities1709160000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create activities for existing clans (CLAN_CREATED)
        await queryRunner.query(`
            INSERT INTO activities (user_id, type, data, created_at)
            SELECT 
                creator_id,
                'CLAN_CREATED',
                jsonb_build_object(
                    'clanId', id,
                    'clanName', name,
                    'clanTag', tag
                ),
                created_at
            FROM clans
            WHERE NOT EXISTS (
                SELECT 1 FROM activities 
                WHERE activities.user_id = clans.creator_id 
                AND activities.type = 'CLAN_CREATED'
                AND activities.data->>'clanId' = clans.id::text
            );
        `);

        // Create activities for existing clan members (CLAN_JOINED)
        await queryRunner.query(`
            INSERT INTO activities (user_id, type, data, created_at)
            SELECT 
                cm.user_id,
                'CLAN_JOINED',
                jsonb_build_object(
                    'clanId', c.id,
                    'clanName', c.name,
                    'clanTag', c.tag
                ),
                cm.joined_at
            FROM clan_members cm
            JOIN clans c ON c.id = cm.clan_id
            WHERE cm.role != 'leader'
            AND NOT EXISTS (
                SELECT 1 FROM activities 
                WHERE activities.user_id = cm.user_id 
                AND activities.type = 'CLAN_JOINED'
                AND activities.data->>'clanId' = c.id::text
            );
        `);

        // Create activities for existing follows (USER_FOLLOWED)
        await queryRunner.query(`
            INSERT INTO activities (user_id, type, data, created_at)
            SELECT 
                f.following_id,
                'USER_FOLLOWED',
                jsonb_build_object(
                    'followerId', f.follower_id,
                    'followerUsername', u.username,
                    'followerAvatar', u.avatar_url
                ),
                f.created_at
            FROM follows f
            JOIN users u ON u.id = f.follower_id
            WHERE NOT EXISTS (
                SELECT 1 FROM activities 
                WHERE activities.user_id = f.following_id 
                AND activities.type = 'USER_FOLLOWED'
                AND activities.data->>'followerId' = f.follower_id::text
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove historical activities
        await queryRunner.query(`
            DELETE FROM activities 
            WHERE type IN ('CLAN_CREATED', 'CLAN_JOINED', 'USER_FOLLOWED');
        `);
    }
}
