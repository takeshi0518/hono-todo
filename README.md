# hono-todo

Hono + Cloudflare Workers + D1 で構築した Todo REST API。

公開 URL: https://hono-todo-api.y-takeshi0518.workers.dev

## 技術スタック

- TypeScript
- Hono (Cloudflare Workers)
- D1 (SQLite)
- npm workspaces

## API

| Method | Path       | 説明           |
| ------ | ---------- | -------------- |
| GET    | /todos     | 一覧取得       |
| POST   | /todos     | 作成           |
| PUT    | /todos/:id | 完了状態の更新 |
| DELETE | /todos/:id | 削除           |

## 初回のみ必要なこと

Cloudflare アカウントの`workers.dev`サブドメインを登録する。
ダッシュボード（https://dash.cloudflare.com）の Workers & Pages → Account Details で確認できる。

```bash
cd apps/api

# D1データベースを作成
npx wrangler d1 create hono-todo-db
```

出力された`database_id`を`wrangler.jsonc`の`d1_databases`に記入する。

## セットアップ

```bash
git clone https://github.com/takeshi0518/hono-todo.git

# ルートで
npm install

cd apps/api

# ローカルD1にスキーマ適用
npx wrangler d1 execute hono-todo-db --local --file=./schema.sql

```

## 開発

```bash
cd apps/api

# http://localhost:8787
npm run dev

```

## デプロイ

```bash
cd apps/api

# リモートD1にスキーマ適用(初回のみ)
npx wrangler d1 execute hono-todo-db --remote --file=./schema.sql

npm run deploy

```
