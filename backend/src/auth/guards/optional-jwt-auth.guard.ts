import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    // Override handleRequest to make authentication optional
    handleRequest(err: any, user: any) {
        // If there's an error or no user, just return null instead of throwing
        if (err || !user) {
            return null;
        }
        return user;
    }

    // Override canActivate to always return true
    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            await super.canActivate(context);
        } catch (err) {
            // Ignore authentication errors
        }
        return true;
    }
}
