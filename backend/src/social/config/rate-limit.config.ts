import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const RATE_LIMIT_CONFIG: ThrottlerModuleOptions = {
    throttlers: [
        {
            name: 'default',
            ttl: 60000, // 1 minute
            limit: 60, // 60 requests per minute
        },
        {
            name: 'follow',
            ttl: 60000, // 1 minute
            limit: 10, // 10 follow/unfollow actions per minute
        },
        {
            name: 'message',
            ttl: 60000, // 1 minute
            limit: 20, // 20 messages per minute
        },
        {
            name: 'rating',
            ttl: 300000, // 5 minutes
            limit: 5, // 5 ratings per 5 minutes
        },
        {
            name: 'comment',
            ttl: 60000, // 1 minute
            limit: 15, // 15 comments per minute
        },
    ],
};

// Rate limit decorators for specific actions
export const FOLLOW_RATE_LIMIT = {
    ttl: 60000,
    limit: 10,
};

export const MESSAGE_RATE_LIMIT = {
    ttl: 60000,
    limit: 20,
};

export const RATING_RATE_LIMIT = {
    ttl: 300000,
    limit: 5,
};

export const COMMENT_RATE_LIMIT = {
    ttl: 60000,
    limit: 15,
};
