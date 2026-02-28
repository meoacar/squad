import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        ElasticsearchModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                node: configService.get('ELASTICSEARCH_NODE', 'http://localhost:9200'),
                maxRetries: 3,
                requestTimeout: 60000,
                sniffOnStart: false,
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([Post, User]),
    ],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService, ElasticsearchModule],
})
export class SearchModule { }
