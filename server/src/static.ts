import { promises as fs } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MiddlewareHandler } from 'hono';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// When built: server/dist/ → sibling web/dist/
// In dev we don't serve static assets — Vite handles the web.
const WEB_DIST = resolve(__dirname, '..', '..', 'web', 'dist');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function contentType(path: string): string {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  return MIME[ext] ?? 'application/octet-stream';
}

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await fs.stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

/**
 * Serves the built SPA from web/dist. Returns index.html for any unmatched
 * non-file route so client-side routing works.
 */
export const serveStatic: MiddlewareHandler = async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') return next();

  const url = new URL(c.req.url);
  const rawPath = decodeURIComponent(url.pathname);
  // Refuse path traversal
  if (rawPath.includes('..')) return next();

  const candidate = rawPath === '/' ? '/index.html' : rawPath;
  const filePath = join(WEB_DIST, candidate);

  if (await fileExists(filePath)) {
    const data = await fs.readFile(filePath);
    return c.body(data, 200, { 'Content-Type': contentType(filePath) });
  }

  // SPA fallback → index.html
  const indexPath = join(WEB_DIST, 'index.html');
  if (await fileExists(indexPath)) {
    const data = await fs.readFile(indexPath);
    return c.body(data, 200, { 'Content-Type': 'text/html; charset=utf-8' });
  }

  return next();
};
