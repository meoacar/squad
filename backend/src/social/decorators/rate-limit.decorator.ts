import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
    ttl: number; // Time to live in milliseconds
    limit: number; // Number of requests allowed
}

// Custom decorator for follow actions
export const FollowRateLimit = () => Throttle({ default: { ttl: 60000, limit: 10 } });

// Custom decorator for message actions
export const MessageRateLimit = () => Throttle({ default: { ttl: 60000, limit: 20 } });

// Custom decorator for rating actions
export const RatingRateLimit = () => Throttle({ default: { ttl: 300000, limit: 5 } });

// Custom decorator for comment actions
export const CommentRateLimit = () => Throttle({ default: { ttl: 60000, limit: 15 } });

// Generic rate limit decorator
export const CustomRateLimit = (options: RateLimitOptions) =>
    Throttle({ default: { ttl: options.ttl, limit: options.limit } });
