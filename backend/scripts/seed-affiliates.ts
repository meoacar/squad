import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AffiliatesService } from '../src/affiliates/affiliates.service';
import { AffiliateProvider, AffiliateCategory } from '../src/affiliates/entities/affiliate-link.entity';

async function seedAffiliates() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const affiliatesService = app.get(AffiliatesService);

    const sampleLinks = [
        // UC Packages
        {
            name: '60 UC',
            url: 'https://www.codashop.com/tr-tr/pubg-mobile-uc',
            short_code: 'uc-60',
            provider: AffiliateProvider.CODASHOP,
            category: AffiliateCategory.UC,
            commission_rate: 3.5,
            price: '₺7.99',
            image_url: 'https://via.placeholder.com/200x200?text=60+UC',
            description: 'PUBG Mobile 60 UC - Anında teslimat',
            rating: 4.8,
            is_active: true,
        },
        {
            name: '325 UC (+25 Bonus)',
            url: 'https://www.codashop.com/tr-tr/pubg-mobile-uc',
            short_code: 'uc-325',
            provider: AffiliateProvider.CODASHOP,
            category: AffiliateCategory.UC,
            commission_rate: 3.5,
            price: '₺39.99',
            image_url: 'https://via.placeholder.com/200x200?text=325+UC',
            description: 'PUBG Mobile 325 UC + 25 Bonus - Anında teslimat',
            rating: 4.9,
            is_active: true,
        },
        {
            name: '660 UC (+60 Bonus)',
            url: 'https://www.codashop.com/tr-tr/pubg-mobile-uc',
            short_code: 'uc-660',
            provider: AffiliateProvider.CODASHOP,
            category: AffiliateCategory.UC,
            commission_rate: 3.5,
            price: '₺79.99',
            image_url: 'https://via.placeholder.com/200x200?text=660+UC',
            description: 'PUBG Mobile 660 UC + 60 Bonus - Anında teslimat',
            rating: 4.9,
            is_active: true,
        },
        {
            name: '1800 UC (+300 Bonus)',
            url: 'https://www.codashop.com/tr-tr/pubg-mobile-uc',
            short_code: 'uc-1800',
            provider: AffiliateProvider.CODASHOP,
            category: AffiliateCategory.UC,
            commission_rate: 3.5,
            price: '₺199.99',
            image_url: 'https://via.placeholder.com/200x200?text=1800+UC',
            description: 'PUBG Mobile 1800 UC + 300 Bonus - Anında teslimat',
            rating: 5.0,
            is_active: true,
        },
        {
            name: '3850 UC (+850 Bonus)',
            url: 'https://www.codashop.com/tr-tr/pubg-mobile-uc',
            short_code: 'uc-3850',
            provider: AffiliateProvider.CODASHOP,
            category: AffiliateCategory.UC,
            commission_rate: 3.5,
            price: '₺399.99',
            image_url: 'https://via.placeholder.com/200x200?text=3850+UC',
            description: 'PUBG Mobile 3850 UC + 850 Bonus - Anında teslimat',
            rating: 5.0,
            is_active: true,
        },
        {
            name: '8100 UC (+2100 Bonus)',
            url: 'https://www.codashop.com/tr-tr/pubg-mobile-uc',
            short_code: 'uc-8100',
            provider: AffiliateProvider.CODASHOP,
            category: AffiliateCategory.UC,
            commission_rate: 3.5,
            price: '₺799.99',
            image_url: 'https://via.placeholder.com/200x200?text=8100+UC',
            description: 'PUBG Mobile 8100 UC + 2100 Bonus - Anında teslimat',
            rating: 5.0,
            is_active: true,
        },
        // Gaming Gear
        {
            name: 'Logitech G502 HERO Gaming Mouse',
            url: 'https://www.amazon.com.tr/dp/B07GBZ4Q68',
            short_code: 'gaming-mouse-g502',
            provider: AffiliateProvider.AMAZON,
            category: AffiliateCategory.GAMING_GEAR,
            commission_rate: 5.0,
            price: '₺899.99',
            image_url: 'https://via.placeholder.com/200x200?text=G502',
            description: 'Yüksek performanslı gaming mouse, 25K DPI sensör',
            rating: 4.7,
            is_active: true,
        },
        {
            name: 'HyperX Cloud II Gaming Kulaklık',
            url: 'https://www.amazon.com.tr/dp/B00SAYCXWG',
            short_code: 'gaming-headset-hyperx',
            provider: AffiliateProvider.AMAZON,
            category: AffiliateCategory.GAMING_GEAR,
            commission_rate: 5.0,
            price: '₺1,299.99',
            image_url: 'https://via.placeholder.com/200x200?text=HyperX',
            description: '7.1 surround ses, rahat kullanım, profesyonel kalite',
            rating: 4.8,
            is_active: true,
        },
        {
            name: 'Razer BlackWidow V3 Mekanik Klavye',
            url: 'https://www.amazon.com.tr/dp/B08FQMKSF5',
            short_code: 'gaming-keyboard-razer',
            provider: AffiliateProvider.AMAZON,
            category: AffiliateCategory.GAMING_GEAR,
            commission_rate: 5.0,
            price: '₺1,899.99',
            image_url: 'https://via.placeholder.com/200x200?text=Razer',
            description: 'Mekanik switchler, RGB aydınlatma, dayanıklı yapı',
            rating: 4.6,
            is_active: true,
        },
        {
            name: 'Anker PowerCore 20000mAh Powerbank',
            url: 'https://www.amazon.com.tr/dp/B00X5RV14Y',
            short_code: 'powerbank-anker',
            provider: AffiliateProvider.AMAZON,
            category: AffiliateCategory.ACCESSORIES,
            commission_rate: 4.0,
            price: '₺599.99',
            image_url: 'https://via.placeholder.com/200x200?text=Anker',
            description: 'Yüksek kapasiteli powerbank, hızlı şarj desteği',
            rating: 4.9,
            is_active: true,
        },
        // VPN
        {
            name: 'NordVPN 2 Yıllık Plan',
            url: 'https://nordvpn.com',
            short_code: 'vpn-nord-2y',
            provider: AffiliateProvider.NORDVPN,
            category: AffiliateCategory.VPN,
            commission_rate: 40.0,
            price: '$89.99',
            image_url: 'https://via.placeholder.com/200x200?text=NordVPN',
            description: 'Düşük ping, güvenli bağlantı, 60+ ülke',
            rating: 4.7,
            is_active: true,
        },
        {
            name: 'ExpressVPN 1 Yıllık Plan',
            url: 'https://www.expressvpn.com',
            short_code: 'vpn-express-1y',
            provider: AffiliateProvider.CUSTOM,
            category: AffiliateCategory.VPN,
            commission_rate: 35.0,
            price: '$99.95',
            image_url: 'https://via.placeholder.com/200x200?text=ExpressVPN',
            description: 'Ultra hızlı bağlantı, oyun için optimize',
            rating: 4.8,
            is_active: true,
        },
    ];

    console.log('🌱 Seeding affiliate links...');

    for (const link of sampleLinks) {
        try {
            await affiliatesService.createLink(link);
            console.log(`✅ Created: ${link.name}`);
        } catch (error) {
            console.log(`⚠️  Skipped: ${link.name} (already exists or error)`);
        }
    }

    console.log('✨ Seeding completed!');
    await app.close();
}

seedAffiliates()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
