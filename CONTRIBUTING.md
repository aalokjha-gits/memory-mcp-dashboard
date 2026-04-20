# Contributing to memory-mcp-dashboard

Thanks for considering a contribution — this project is young and very open to direction.

## Before filing an issue

- Check the [README](README.md) to make sure the behaviour you're seeing isn't expected.
- Search [open issues](https://github.com/aalokjha-gits/memory-mcp-dashboard/issues) for a duplicate.
- Include: what you did, what you expected, what happened, Node version, OS, and the contents of relevant env vars (**redact tokens / API keys**).

## Development setup

```bash
git clone https://github.com/aalokjha-gits/memory-mcp-dashboard.git
cd memory-mcp-dashboard
npm install
npm run dev
```

- Server hot-reloads via `tsx watch`.
- Web hot-reloads via Vite.
- Requires Node 18+.

Run the test suite:

```bash
npm test           # watch mode
npm test -- --run  # single run, as CI runs it
```

Type-check the whole monorepo:

```bash
npm run typecheck
```

## Branch and PR flow

1. Branch off `master` using a descriptive name: `feat/saved-queries`, `fix/graph-off-by-one`, `docs/readme-screenshots`.
2. Keep PRs focused — one concern per PR.
3. Make sure `npm run typecheck`, `npm run build`, and `npm test -- --run` all pass.
4. Open a PR against `master`. Include a short description of what changed and why.

## Code style

- TypeScript, strict mode. No `any` unless you have a comment explaining why.
- Prefer small focused components over giant files.
- Web follows the existing cyberpunk/HUD aesthetic — stick to the Tailwind tokens in `tailwind.config.ts` rather than introducing new colours.
- Server follows memory-mcp's provider pattern (interfaces in `vectordb/index.ts` and `embedding/index.ts`). New storage or embedding backends should slot in as a new file and a `createX` switch case.
- No `console.log` in committed code — use `console.error` for server logs (it goes to stderr, doesn't interleave with potential stdout responses).

## Adding a new storage backend

1. Implement `VectorDBProvider` from `server/src/vectordb/index.ts`.
2. Add the case to `createVectorDBProvider`.
3. Add defaults to `VECTORDB_DEFAULTS` in `server/src/config.ts`.
4. Document the env vars in the README's config table.
5. Add at least one unit test covering the happy path.

## Adding a new embedding provider

1. Implement `EmbeddingProvider` from `server/src/embedding/index.ts`.
2. Wire it into `createEmbeddingProvider`.
3. Add defaults to `EMBEDDING_DEFAULTS`.
4. Document it in the README.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to abide by it.
