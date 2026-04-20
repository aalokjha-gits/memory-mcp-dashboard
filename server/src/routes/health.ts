import { Hono } from 'hono';
import { getContext } from '../context.js';
import type { HealthReport } from '../schemas.js';

export const healthRoutes = new Hono();

healthRoutes.get('/', async (c) => {
  const report: HealthReport = {
    vectordb: { ok: false, provider: 'unknown', latency_ms: 0 },
    embedding: { ok: false, provider: 'unknown', latency_ms: 0 },
  };

  try {
    const ctx = await getContext();

    const vStart = performance.now();
    try {
      await ctx.vectordb.scrollMemories(1, 0);
      report.vectordb = {
        ok: true,
        provider: ctx.vectordb.name,
        latency_ms: Math.round(performance.now() - vStart),
      };
    } catch (e) {
      report.vectordb = {
        ok: false,
        provider: ctx.vectordb.name,
        latency_ms: Math.round(performance.now() - vStart),
        error: e instanceof Error ? e.message : String(e),
      };
    }

    const eStart = performance.now();
    try {
      const vec = await ctx.embedding.getEmbedding('health check');
      report.embedding = {
        ok: true,
        provider: ctx.embedding.name,
        dim: vec.length,
        latency_ms: Math.round(performance.now() - eStart),
      };
    } catch (e) {
      report.embedding = {
        ok: false,
        provider: ctx.embedding.name,
        latency_ms: Math.round(performance.now() - eStart),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  } catch (e) {
    return c.json(
      { ...report, bootstrap_error: e instanceof Error ? e.message : String(e) },
      503,
    );
  }

  return c.json(report);
});
