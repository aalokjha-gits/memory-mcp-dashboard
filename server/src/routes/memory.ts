import { Hono } from 'hono';
import { v4 as uuid } from 'uuid';
import {
  CreateMemoryInput,
  SearchMemoryInput,
  ListMemoryInput,
  type MemoryPayloadType,
  type GraphReport,
} from '../schemas.js';
import { getContext } from '../context.js';
import { autoCategory } from '../categorize.js';
import { autoImportance } from '../importance.js';

export const memoryRoutes = new Hono();

function buildFilter(opts: { type?: string; tags?: string[]; project?: string }) {
  const must: Array<Record<string, unknown>> = [];
  if (opts.type) must.push({ key: 'type', match: { value: opts.type } });
  if (opts.project) must.push({ key: 'project', match: { value: opts.project } });
  if (opts.tags?.length) must.push({ key: 'tags', match: { any: opts.tags } });
  return must.length ? { must } : undefined;
}

memoryRoutes.post('/search', async (c) => {
  const parsed = SearchMemoryInput.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const { query, limit, type, tags, project, min_score } = parsed.data;
  const ctx = await getContext();
  const vector = await ctx.embedding.getEmbedding(query);
  const hits = await ctx.vectordb.searchMemories(vector, limit, buildFilter({ type, tags, project }), min_score);
  return c.json({ hits });
});

memoryRoutes.post('/list', async (c) => {
  const parsed = ListMemoryInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const { type, tags, project, limit, offset } = parsed.data;
  const ctx = await getContext();
  const points = await ctx.vectordb.scrollMemories(limit, offset, buildFilter({ type, tags, project }));
  return c.json({ points });
});

memoryRoutes.post('/', async (c) => {
  const parsed = CreateMemoryInput.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const { content, type, tags, project, importance } = parsed.data;
  const resolvedType = type === 'auto' ? autoCategory(content) : type;
  const resolvedImportance = importance ?? autoImportance(content, resolvedType);
  const id = uuid();
  const timestamp = new Date().toISOString();
  const ctx = await getContext();
  const vector = await ctx.embedding.getEmbedding(content);
  const payload: MemoryPayloadType = {
    id,
    content,
    type: resolvedType,
    tags,
    project,
    importance: resolvedImportance,
    timestamp,
  };
  await ctx.vectordb.upsertMemory(vector, payload);

  const related = await ctx.vectordb.searchMemories(vector, 3, undefined, 0.7);
  const toLink = related.filter((r) => r.id !== id);
  for (const r of toLink) await ctx.vectordb.linkMemories(id, r.id);

  return c.json({ id, payload, linked_to: toLink.map((r) => r.id) }, 201);
});

memoryRoutes.delete('/:id', async (c) => {
  const ctx = await getContext();
  await ctx.vectordb.deleteMemory(c.req.param('id'));
  return c.json({ ok: true });
});

memoryRoutes.post('/:id/link/:other', async (c) => {
  const ctx = await getContext();
  await ctx.vectordb.linkMemories(c.req.param('id'), c.req.param('other'));
  return c.json({ ok: true });
});

memoryRoutes.get('/:id', async (c) => {
  const ctx = await getContext();
  const m = await ctx.vectordb.getMemoryById(c.req.param('id'));
  if (!m) return c.json({ error: 'not found' }, 404);
  return c.json({ id: m.id, payload: m.payload });
});

memoryRoutes.get('/graph/all', async (c) => {
  const ctx = await getContext();
  const points = await ctx.vectordb.scrollMemories(500, 0);
  const seen = new Set<string>();
  const nodes: GraphReport['nodes'] = [];
  for (const p of points) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    nodes.push({
      id: p.id,
      type: p.payload.type,
      importance: p.payload.importance,
      content: p.payload.content.slice(0, 160),
      timestamp: p.payload.timestamp,
    });
  }
  const pairs = new Set<string>();
  const links: GraphReport['links'] = [];
  for (const p of points) {
    for (const other of p.payload.linked_ids ?? []) {
      const key = [p.id, other].sort().join('|');
      if (pairs.has(key)) continue;
      pairs.add(key);
      links.push({ source: p.id, target: other });
    }
  }
  return c.json({ nodes, links } satisfies GraphReport);
});
