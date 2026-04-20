import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { getConfig } from './config.js';
import { getContext } from './context.js';
import { memoryRoutes } from './routes/memory.js';
import { healthRoutes } from './routes/health.js';
import { statsRoutes } from './routes/stats.js';
import { bearerAuth } from './auth.js';
import { serveStatic } from './static.js';

const app = new Hono();
app.use('*', logger((msg) => console.error(msg)));

const config = getConfig();

// CORS: when bound to localhost and untokened, allow any origin for dev convenience.
// When a token is set, restrict to same-origin only (users can override via reverse proxy).
app.use(
  '/api/*',
  cors({
    origin: config.server.token ? (origin) => origin ?? '' : '*',
    credentials: !!config.server.token,
  }),
);

app.use('/api/*', bearerAuth);

app.get('/api', (c) =>
  c.json({
    service: 'memory-mcp-dashboard',
    version: '0.1.0',
    vectordb: config.vectordb.provider,
    embedding: config.embedding.provider,
  }),
);
app.route('/api/memory', memoryRoutes);
app.route('/api/health', healthRoutes);
app.route('/api/stats', statsRoutes);

app.use('*', serveStatic);

app.onError((err, c) => {
  console.error('[dashboard] error:', err);
  return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
});

async function main() {
  // Warm up storage/embedding so the first request isn't slow.
  try {
    await getContext();
    console.error(
      `[dashboard] vectordb=${config.vectordb.provider} embedding=${config.embedding.provider}`,
    );
  } catch (e) {
    console.error(
      '[dashboard] bootstrap warning:',
      e instanceof Error ? e.message : e,
    );
  }

  serve(
    { fetch: app.fetch, port: config.server.port, hostname: config.server.host },
    (info) => {
      const host = info.address === '::1' ? 'localhost' : info.address;
      console.error(
        `[dashboard] listening on http://${host}:${info.port}` +
          (config.server.token ? ' (bearer auth enabled)' : ''),
      );
    },
  );
}

main().catch((e) => {
  console.error('[dashboard] fatal:', e);
  process.exit(1);
});
