import { z } from 'zod';

export const MemoryType = z.enum([
  'knowledge',
  'decision',
  'pattern',
  'preference',
  'context',
  'debug',
  'auto',
]);
export type MemoryType = z.infer<typeof MemoryType>;

export const MemoryPayloadSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.string(),
  tags: z.array(z.string()).optional(),
  project: z.string().optional(),
  importance: z.number().min(0).max(1),
  timestamp: z.string(),
  linked_ids: z.array(z.string()).optional(),
});
export type MemoryPayloadType = z.infer<typeof MemoryPayloadSchema>;

export const CreateMemoryInput = z.object({
  content: z.string().min(1),
  type: MemoryType.default('auto'),
  tags: z.array(z.string()).optional(),
  project: z.string().optional(),
  importance: z.number().min(0).max(1).optional(),
});
export type CreateMemoryInput = z.infer<typeof CreateMemoryInput>;

export const SearchMemoryInput = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  project: z.string().optional(),
  min_score: z.number().min(0).max(1).optional(),
});
export type SearchMemoryInput = z.infer<typeof SearchMemoryInput>;

export const ListMemoryInput = z.object({
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  project: z.string().optional(),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
});
export type ListMemoryInput = z.infer<typeof ListMemoryInput>;

export interface HealthReport {
  vectordb: {
    ok: boolean;
    provider: string;
    latency_ms: number;
    error?: string;
  };
  embedding: {
    ok: boolean;
    provider: string;
    dim?: number;
    latency_ms: number;
    error?: string;
  };
}

export interface CollectionStats {
  name: string;
  points_count: number;
  status: string;
}

export interface StatsReport {
  provider: string;
  collections: CollectionStats[];
  total_memories: number;
  by_type: Record<string, number>;
  total_links: number;
}

export interface GraphNode {
  id: string;
  type: string;
  importance: number;
  content: string;
  timestamp: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphReport {
  nodes: GraphNode[];
  links: GraphLink[];
}
