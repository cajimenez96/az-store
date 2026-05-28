import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiter for login attempts
 * 5 attempts per 15 minutes per email address
 * Uses Upstash Redis for persistence across serverless instances
 */
export const loginLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: false,
});
