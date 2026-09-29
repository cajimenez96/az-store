import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Uses Upstash Redis in production; disabled in development if not configured
const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

// Rate limiter for login attempts: 5 attempts per 15 minutes per email
const loginRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: false,
    })
  : null;

// Rate limiter for promo code validation: 10 attempts per minute per IP / user
const promoRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: false,
    })
  : null;

export const loginLimiter = {
  limit: async (key: string) => {
    if (!loginRatelimit) return { success: true };
    return loginRatelimit.limit(key);
  },
};

export const promoLimiter = {
  limit: async (key: string) => {
    if (!promoRatelimit) return { success: true };
    return promoRatelimit.limit(key);
  },
};

