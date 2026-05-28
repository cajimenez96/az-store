import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiter for login attempts: 5 attempts per 15 minutes per email
// Uses Upstash Redis in production; disabled in development if not configured
const limiter = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: false,
    })
  : null;

export const loginLimiter = {
  limit: async (key: string) => {
    if (!limiter) return { success: true };
    return limiter.limit(key);
  },
};
