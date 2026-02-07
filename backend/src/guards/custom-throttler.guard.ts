import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    private readonly logger = new Logger(CustomThrottlerGuard.name);

    protected async handleRequest(requestProps: any): Promise<boolean> {
        const { context, limit, ttl, throttler, getTracker } = requestProps;

        // We can call getTracker() directly if it's passed in props, or via this.getTracker(req)
        // In v6, getTracker seems to be part of the props or the class.
        // Let's rely on super to do the work, but log what we can.

        // Just log that we entered.
        this.logger.log(`ThrottlerGuard handling request...`);

        const result = await super.handleRequest(requestProps);

        if (!result) {
            this.logger.warn(`Blocked request (Limit: ${limit}, TTL: ${ttl})`);
        }
        return result;
    }
}
