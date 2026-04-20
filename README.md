# memory-mcp · dashboard

**A cyberpunk-themed browser for the memory store that powers [@aalokjha/mem-aj](https://github.com/aalokjha-gits/memory-mcp).**

See what your AI agent remembers. Search it semantically. Watch connections form as a polar-radar constellation where types become sectors and importance pulls memories toward the core.

![badges](https://img.shields.io/badge/node-%3E%3D18-green) ![license](https://img.shields.io/badge/license-MIT-blue)

> ⚠️ **Status:** `v0.1.0` — alpha. The UI is stable; screenshots, production packaging, and some providers are still being ironed out. Feedback via issues is very welcome.

---

## Why

`@aalokjha/mem-aj` is a [Model Context Protocol](https://modelcontextprotocol.io/) server that gives AI agents persistent memory. It writes to either a local JSON file (`~/.memory-mcp/memories.json`) or a Qdrant instance.

This project is a **separate web app** that reads the same store and lets you:

- 🔍 **Semantic search** — query by meaning using the same embedding provider your agent uses
- 🧠 **Neural Constellation** — polar radar: types → sectors, importance → radius, synapses bow toward the core
- 📋 **Memory Index** — filter by type, browse by recency, inspect any node
- ➕ **Inject memories** from the UI (auto-categorized + importance-scored like `memory_add`)
- 🔗 **Follow links** between related memories
- 📊 **Live telemetry** — total memories, synapse count, cluster distribution

Works with **both storage modes** (zero-config local file + production Qdrant) and **all the same embedding providers** as memory-mcp (transformersjs / openai / ollama / custom / local).

## Quick start

Clone, install, run:

```bash
git clone https://github.com/aalokjha-gits/memory-mcp-dashboard.git
cd memory-mcp-dashboard
npm install
npm run dev
```

- **API** → http://127.0.0.1:8787
- **Web** → http://localhost:5173 (Vite dev proxies `/api` to the server)

On first run with the default `transformersjs` embedder, the server downloads a ~90 MB model (same one mem-aj uses). After that, launches are instant.

### Reading your existing mem-aj data

If you already run `@aalokjha/mem-aj` with its defaults, the dashboard reads the **exact same file** at `~/.memory-mcp/memories.json` with no setup:

```bash
npm run dev
# → opens a view of every memory your agent has ever written
```

If you run mem-aj against Qdrant, point the dashboard at the same instance:

```bash
export VECTORDB_PROVIDER=qdrant
export QDRANT_URL=http://localhost:6333
npm run dev
```

### Production build

```bash
npm run build
npm start  # serves the built SPA + API on the same port (default 8787)
```

## Configuration

The dashboard reads **the same environment variables as memory-mcp**, so if you already have them set your agent and the dashboard will operate on the same store.

### Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8787` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address. Localhost by default — set to `0.0.0.0` only if you know what you're doing. |
| `DASHBOARD_TOKEN` | *(unset)* | If set, all `/api/*` routes require `Authorization: Bearer <token>`. Recommended whenever `HOST` isn't localhost. |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |

### Vector store

| Variable | Default | Description |
|---|---|---|
| `VECTORDB_PROVIDER` | `local` | `local` (file JSON at `~/.memory-mcp/`) or `qdrant` |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant endpoint (when `provider=qdrant`) |
| `VECTORDB_URL` | — | Alternative to `QDRANT_URL` (for local, a directory path; blank = `~/.memory-mcp`) |
| `VECTORDB_COLLECTION` | `memories` | Collection / file name |
| `VECTORDB_API_KEY` | — | API key for managed Qdrant |

### Embeddings

Same env vars as [`@aalokjha/mem-aj`](https://github.com/aalokjha-gits/memory-mcp#configuration):

| Variable | Default | Description |
|---|---|---|
| `EMBEDDING_PROVIDER` | `transformersjs` | `transformersjs` / `openai` / `ollama` / `custom` / `local` |
| `EMBEDDING_URL` | provider default | Endpoint for `local`/`ollama`/`custom` |
| `EMBEDDING_API_KEY` | — | Required for `openai` |
| `EMBEDDING_MODEL` | provider default | e.g. `text-embedding-3-small`, `Xenova/all-MiniLM-L6-v2` |
| `EMBEDDING_DIMENSIONS` | provider default | Override if using a non-default model |
| `EMBEDDING_MAX_TOKENS` | provider default | |

Copy [.env.example](.env.example) to `.env` as a starting template.

## Security

- **Localhost by default.** The server binds `127.0.0.1` out of the box — it won't accept remote connections without explicit configuration.
- **Optional bearer auth.** Set `DASHBOARD_TOKEN=...` and every `/api/*` request must include `Authorization: Bearer <token>`. No token = no auth (acceptable only when `HOST=127.0.0.1`).
- **No credential storage.** Memories themselves go to whichever vector store you configured. The dashboard is a thin view.

If you want to expose the dashboard over a network, **always pair `HOST=0.0.0.0` with `DASHBOARD_TOKEN` and terminate TLS with a reverse proxy** (Caddy, nginx, Traefik — your pick).

## Architecture

```
┌──────────────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
│  Web (Vite / React)  │───▶│  Server (Hono)      │───▶│  Vector store        │
│  • Memory Index      │    │  • /api/memory/…    │    │  • Local JSON        │
│  • Neural Constellation │  • /api/health       │    │    (~/.memory-mcp/)  │
│  • Inspector         │    │  • /api/stats       │    │  • or Qdrant         │
└──────────────────────┘    └──────────┬──────────┘    └──────────────────────┘
                                       │
                                       ▼
                             ┌─────────────────────┐
                             │  Embedding provider │
                             │  transformersjs /   │
                             │  openai / ollama /  │
                             │  custom / local     │
                             └─────────────────────┘
```

The server wraps the same `VectorDBProvider` / `EmbeddingProvider` interfaces as memory-mcp, so a memory written by your agent is immediately visible in the dashboard and vice versa.

## Project layout

```
.
├── server/          # Hono HTTP API + storage & embedding providers
│   └── src/
│       ├── routes/           # memory, health, stats
│       ├── vectordb/         # local file + qdrant
│       ├── embedding/        # transformersjs, openai, ollama, custom, local
│       ├── auth.ts           # optional bearer middleware
│       ├── static.ts         # serves the built SPA in production
│       └── index.ts
└── web/             # Vite + React dashboard
    └── src/
        ├── components/hud/   # cyberpunk shell (sidebar, panels, background)
        ├── components/panels/# Memory Index, Neural Constellation, Inspector
        └── pages/Dashboard.tsx
```

## Scripts

From the repo root:

| Command | What |
|---|---|
| `npm run dev` | Run server + Vite dev server concurrently |
| `npm run build` | Type-check + build both packages |
| `npm start` | Run built server (serves SPA on same port) |
| `npm test` | Run server unit tests (vitest) |
| `npm run typecheck` | `tsc --noEmit` across workspaces |
| `npm run clean` | Remove build output + `node_modules` |

## Roadmap

- [ ] Published npm package (`@aalokjha/mem-aj-dashboard`) — one-shot `npx` launch
- [ ] Screenshots + short demo clip in this README
- [ ] Profile (`memory_profile`) view — the MCP supports it; dashboard doesn't surface it yet
- [ ] Saved queries & query history
- [ ] Light theme (yes, really)
- [ ] Keyboard navigation across Memory Index items

## Contributing

Issues and PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Quick dev loop:

```bash
npm install
npm run dev
# edit. Vite HMRs the web, tsx reloads the server.
npm test -- --watch   # optional — in another shell
```

## License

[MIT](LICENSE) · Built by [Aalok Jha](https://github.com/aalokjha-gits)
