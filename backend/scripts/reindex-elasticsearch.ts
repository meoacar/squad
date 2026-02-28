import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SearchService } from '../src/search/search.service';

async function bootstrap() {
    console.log('🔍 Elasticsearch Reindexing başlatılıyor...\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const searchService = app.get(SearchService);

    try {
        // Posts'ları reindex et
        console.log('📝 Posts reindex ediliyor...');
        const postsResult = await searchService.reindexAllPosts();
        console.log(`✅ ${postsResult.count} post başarıyla index'lendi\n`);

        // Users'ları reindex et
        console.log('👥 Users reindex ediliyor...');
        const usersResult = await searchService.reindexAllUsers();
        console.log(`✅ ${usersResult.count} kullanıcı başarıyla index'lendi\n`);

        console.log('🎉 Reindexing tamamlandı!');
    } catch (error) {
        console.error('❌ Reindexing hatası:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

bootstrap();
