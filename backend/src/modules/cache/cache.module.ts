import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
    imports: [
        NestCacheModule.registerAsync({
            useFactory: async () => ({
                store: await redisStore({
                    socket: {
                        host: process.env.REDIS_HOST || 'localhost',
                        port: parseInt(process.env.REDIS_PORT || '6379'),
                    },
                    ttl: 300 * 1000, // 5 minutes (in milliseconds for cache-manager v5)
                }),
            }),
        }),
    ],
    exports: [NestCacheModule],
})
export class CacheConfigModule { }
