import { Hono } from 'hono';
import { getContext } from '../context.js';
import { getConfig } from '../config.js';
import type { StatsReport, CollectionStats } from '../schemas.js';

export const statsRoutes = new Hono();

statsRoutes.get('/', async (c) => {
  const ctx = await getContext();
  const config = getConfig();

  const points = await ctx.vectordb.scrollMemories(500, 0);
  const by_type: Record<string, number> = {};
  let total_links = 0;
  for (const p of points) {
    by_type[p.payload.type] = (by_type[p.payload.type] ?? 0) + 1;
    total_links += p.payload.linked_ids?.length ?? 0;
  }

  const collections: CollectionStats[] = [
    {
      name: config.vectordb.collection,
      points_count: points.length,
      status: 'green',
    },
  ];

  const report: StatsReport = {
    provider: ctx.vectordb.name,
    collections,
    total_memories: points.length,
    by_type,
    total_links: Math.floor(total_links / 2),
  };
  return c.json(report);
});
