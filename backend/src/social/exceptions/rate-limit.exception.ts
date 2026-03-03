import { HttpException, HttpStatus } from '@nestjs/common';

export class RateLimitException extends HttpException {
    constructor(
        action: string,
        retryAfter?: number,
    ) {
        const message = retryAfter
            ? `Rate limit exceeded for ${action}. Please try again in ${retryAfter} seconds.`
            : `Rate limit exceeded for ${action}. Please try again later.`;

        super(
            {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                message,
                error: 'Rate Limit Exceeded',
                retryAfter,
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}
