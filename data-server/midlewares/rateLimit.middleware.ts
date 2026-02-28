// for production later on have to change it with redis rate-limit

import type { Request, Response, NextFunction } from "express";

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

// clean up old buckets every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now >= v.resetAt) store.delete(k);
  }
}, 5 * 60 * 1000);

export function rateLimit(opts: {
  key: (req: Request) => string;
  limit: number;
  windowMs: number;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const k = opts.key(req);
    const now = Date.now();
    const b = store.get(k);

    if (!b || now >= b.resetAt) {
      store.set(k, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    b.count += 1;
    if (b.count > opts.limit) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ message: "Too many requests", retryAfter });
    }
    return next();
  };
}

export const ipKey   = (req: Request) =>
  (req.ip || req.socket.remoteAddress || "unknown");

export const deviceKey = (req: Request) =>
  req.header("x-device-id") || "no-device";