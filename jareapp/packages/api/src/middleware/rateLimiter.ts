import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const createLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });

// 3 OTP requests per phone per hour
export const otpLimiter = createLimiter(
  60 * 60 * 1000,
  3,
  'Too many OTP requests. Please wait an hour before trying again.'
);

// 10 posts per user per hour
export const postLimiter = createLimiter(
  60 * 60 * 1000,
  10,
  'Post limit reached. You can create up to 10 posts per hour.'
);

// 30 comments per user per hour
export const commentLimiter = createLimiter(
  60 * 60 * 1000,
  30,
  'Comment limit reached. You can post up to 30 comments per hour.'
);

// 100 messages per user per hour
export const messageLimiter = createLimiter(
  60 * 60 * 1000,
  100,
  'Message limit reached. You can send up to 100 messages per hour.'
);

// General API rate limiter
export const generalLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  'Too many requests. Please slow down.'
);

// Auth endpoints limiter (stricter)
export const authLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many authentication attempts. Please wait before trying again.'
);
