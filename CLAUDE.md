# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working style

これは学習用のプロジェクトです。作者は仕組みを理解するため、実装を手で書いています。

サポートを求められたときは:

- How だけでなく Why を説明してください
- コードを書き換えるのではなく、問題点を指摘し、その理由を説明してください
- 明示的に依頼されない限り、機能を実装しないでください

## Project overview

A Todo REST API built with Hono, running on Cloudflare Workers with a D1 (SQLite) database. This is an npm workspaces monorepo (`apps/*`) with a single package, `apps/api`.

## Commands

All commands are run from `apps/api` (or prefix with `npm run <script> --workspace=apps/api` from the repo root).

```bash
npm install          # from repo root — installs all workspaces
npm run dev           # start local dev server (wrangler dev)
npm run deploy        # deploy to Cloudflare Workers (wrangler deploy --minify)
npm run cf-typegen    # regenerate worker-configuration.d.ts from wrangler.jsonc bindings
```

There is no lint, test, or typecheck script configured for `apps/api`. The root `package.json` test script is an unconfigured placeholder.

To apply the D1 schema (`apps/api/schema.sql`) there is no migrations setup — run it directly against the database with wrangler, e.g. `wrangler d1 execute hono-todo-db --file=./schema.sql` (add `--local` for the local dev DB, `--remote` for production).

## Architecture

- **Single-file API**: all routes live in `apps/api/src/index.ts`. There's no router/controller/service split — as the app grows, keep new routes in this file unless it becomes unwieldy.
- **D1 access is direct SQL**: no ORM. Queries use `c.env.DB.prepare(...).bind(...).all()/.first()/.run()` directly in route handlers.
- **Validation**: request bodies are validated with `@hono/zod-validator` (`zValidator`) + `zod` schemas defined at the top of `index.ts` (e.g. `createTodoSchema`, `updateTodoSchema`). Follow this pattern for new endpoints — validate with a zod schema via `zValidator('json', schema)`, then read parsed data with `c.req.valid('json')`.
- **Row → response mapping**: D1 stores `completed` as `INTEGER` (0/1); the `TodoRow` type reflects the raw DB row, and `toTodoResponse()` converts it to the JSON-facing shape (`completed: boolean`). Keep this conversion pattern for any other boolean-ish columns.
- **Bindings**: Cloudflare bindings (currently just `DB`, the D1 database) are typed via `CloudflareBindings`, generated into `apps/api/worker-configuration.d.ts` by `npm run cf-typegen`. Re-run that command after editing `d1_databases`/other bindings in `wrangler.jsonc`.
- **Known dependency gap**: `zod` and `@hono/zod-validator` are imported in `src/index.ts` and present in `node_modules`, but are _not_ listed in `apps/api/package.json` or `package-lock.json`. A fresh `npm install` will not pull them in — if you touch dependencies, add them to `apps/api/package.json` (`npm install zod @hono/zod-validator --workspace=apps/api`) to fix this.
