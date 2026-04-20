// Shared types mirrored from server/src/schemas.ts.
// Keep in sync with the server to avoid API drift.

export interface MemoryPayload {
  id: string;
  content: string;
  type: string;
  tags?: string[];
  project?: string;
  importance: number;
  timestamp: string;
  linked_ids?: string[];
}

export interface CreateMemoryInput {
  content: string;
  type?: string;
  tags?: string[];
  project?: string;
  importance?: number;
}

export interface SearchMemoryInput {
  query: string;
  limit?: number;
  type?: string;
  tags?: string[];
  project?: string;
  min_score?: number;
}

export interface ListMemoryInput {
  type?: string;
  tags?: string[];
  project?: string;
  limit?: number;
  offset?: number;
}

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
