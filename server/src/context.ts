import type { EmbeddingProvider } from './embedding/index.js';
import type { VectorDBProvider } from './vectordb/index.js';
import { createEmbeddingProvider } from './embedding/index.js';
import { createVectorDBProvider } from './vectordb/index.js';
import { getConfig } from './config.js';

export interface AppContext {
  embedding: EmbeddingProvider;
  vectordb: VectorDBProvider;
}

let _ctx: AppContext | null = null;

export async function getContext(): Promise<AppContext> {
  if (_ctx) return _ctx;
  const config = getConfig();
  const embedding = await createEmbeddingProvider(config.embedding);
  const vectordb = await createVectorDBProvider(config.vectordb, embedding.getDimensions());
  await vectordb.init();
  _ctx = { embedding, vectordb };
  return _ctx;
}
