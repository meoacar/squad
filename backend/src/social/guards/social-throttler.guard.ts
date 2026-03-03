import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RateLimitException } from '../exceptions';

@Injectable()
export class SocialThrottlerGuard extends ThrottlerGuard {
    protected async throwThrottlingException(context: any): Promise<void> {
        const request = context.switchToHttp().getRequest();
        const action = this.getActionFromRequest(request);

        // Get retry-after from throttler
        const retryAfter = this.getRetryAfter(context);

        throw new RateLimitException(action, retryAfter);
    }

    private getActionFromRequest(request: any): string {
        const path = request.route?.path || request.url;

        if (path.includes('/follow')) return 'follow actions';
        if (path.includes('/message')) return 'messaging';
        if (path.includes('/rating')) return 'rating';
        if (path.includes('/comment')) return 'commenting';

        return 'this action';
    }

    private getRetryAfter(context: any): number {
        // Calculate retry-after in seconds based on throttler config
        // This is a simplified version - you may want to enhance this
        return 60; // Default to 60 seconds
    }
}
