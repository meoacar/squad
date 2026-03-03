import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateContactTemplatesTable1709180000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'contact_templates',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'subject',
                        type: 'varchar',
                        length: '200',
                    },
                    {
                        name: 'content',
                        type: 'text',
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'created_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Insert default templates
        await queryRunner.query(`
            INSERT INTO contact_templates (name, subject, content, is_active) VALUES
            ('Genel Teşekkür', 'Mesajınız için teşekkürler', 'Merhaba,\n\nMesajınız için teşekkür ederiz. En kısa sürede size geri dönüş yapacağız.\n\nİyi oyunlar!\nSquadBul Ekibi', true),
            ('Teknik Destek', 'Teknik destek talebiniz', 'Merhaba,\n\nTeknik destek talebinizi aldık. Ekibimiz konuyu inceleyip size en kısa sürede yardımcı olacaktır.\n\nİyi oyunlar!\nSquadBul Ekibi', true),
            ('Hesap Sorunu', 'Hesap sorunuz hakkında', 'Merhaba,\n\nHesabınızla ilgili sorunuzu aldık. Güvenlik ekibimiz konuyu inceleyip size geri dönüş yapacaktır.\n\nİyi oyunlar!\nSquadBul Ekibi', true),
            ('Öneri Teşekkürü', 'Öneriniz için teşekkürler', 'Merhaba,\n\nÖneriniz için çok teşekkür ederiz. Tüm geri bildirimler bizim için çok değerli ve platformumuzu geliştirmemize yardımcı oluyor.\n\nİyi oyunlar!\nSquadBul Ekibi', true)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('contact_templates');
    }
}
