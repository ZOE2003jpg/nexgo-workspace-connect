## Goal

Replace the current placeholder index with the contents of `https://github.com/ZOE2003jpg/next-order-hub.git`.

## Steps

1. Clone `https://github.com/ZOE2003jpg/next-order-hub.git` into `/tmp/gh-norhub` and inspect its structure (framework, routes, package.json).
2. Copy source assets into the workspace:
   - `src/pages/`, `src/components/`, `src/hooks/`, `src/lib/` (merge, do not overwrite Lovable-managed files)
   - `src/routes/*` (if present, TanStack-style)
   - `supabase/migrations/*` and any `supabase/functions/*`
   - `tsconfig.json`, `index.html`, public assets — only if compatible
3. Preserve Lovable-managed files (do NOT overwrite):
   - `src/integrations/supabase/{client,client.server,types,auth-middleware,auth-attacher}.ts`
   - `src/router.tsx`, `src/routes/__root.tsx`, `src/start.ts`, `src/server.ts`, `src/routeTree.gen.ts`
   - `vite.config.ts`, `supabase/config.toml`, `.env`
4. If the repo uses React Router / Vite SPA conventions (`src/pages/` + `App.tsx`), wire it into TanStack Start by creating a catch-all route or per-page route files that render the imported page components. Do not delete `__root.tsx` or introduce `src/pages/` as a routing root (TanStack uses `src/routes/`).
5. Merge `package.json` dependencies (add any missing deps from the cloned repo) and run `bun install`.
6. Replace `src/routes/index.tsx` placeholder with the repo's landing page content.
7. Verify build passes; report any unresolved imports or incompatibilities.

## Risks

- The repo may be a Vite+React Router app, not TanStack Start — pages will need adapter route files.
- Dependency conflicts (React version, Tailwind v3 vs v4) may require manual reconciliation.
- Supabase client paths in the cloned code may differ; imports will be retargeted to `@/integrations/supabase/client`.
