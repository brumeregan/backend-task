import { rateLimit } from 'express-rate-limit';
import { tooManyRequests } from '../errors/httpError';

export const createRateLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(tooManyRequests()),
  });
