import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
    constructor(private configService: ConfigService) { }

    async createCacheOptions(): Promise<CacheModuleOptions> {
        const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

        return {
            // @ts-ignore - cache-manager-redis-store types are not fully compatible
            store: redisStore,
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            ttl: 300, // 5 minutes default TTL (in seconds)
            max: 100, // maximum number of items in cache
        };
    }
}
