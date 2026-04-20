import type { MiddlewareHandler } from 'hono';
import { getConfig } from './config.js';

/**
 * Bearer-token auth. No-op when DASHBOARD_TOKEN is unset, so zero-config
 * local setups (bound to 127.0.0.1) stay frictionless.
 */
export const bearerAuth: MiddlewareHandler = async (c, next) => {
  const token = getConfig().server.token;
  if (!token) return next();

  const header = c.req.header('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match || match[1] !== token) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  return next();
};
