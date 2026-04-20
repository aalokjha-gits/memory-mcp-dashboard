import type {
  CreateMemoryInput,
  SearchMemoryInput,
  ListMemoryInput,
  MemoryPayload,
  HealthReport,
  StatsReport,
  GraphReport,
} from '@/lib/types';

const base = '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => req<HealthReport>('/health'),
  stats: () => req<StatsReport>('/stats'),
  searchMemories: (input: SearchMemoryInput) =>
    req<{ hits: Array<{ id: string; score: number; payload: MemoryPayload }> }>('/memory/search', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  listMemories: (input: Partial<ListMemoryInput> = {}) =>
    req<{ points: Array<{ id: string; payload: MemoryPayload }> }>('/memory/list', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  addMemory: (input: CreateMemoryInput) =>
    req<{ id: string; payload: MemoryPayload; linked_to: string[] }>('/memory', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  deleteMemory: (id: string) => req<{ ok: true }>(`/memory/${id}`, { method: 'DELETE' }),
  linkMemories: (a: string, b: string) =>
    req<{ ok: true }>(`/memory/${a}/link/${b}`, { method: 'POST' }),
  getMemory: (id: string) => req<{ id: string; payload: MemoryPayload }>(`/memory/${id}`),
  graph: () => req<GraphReport>('/memory/graph/all'),
};
