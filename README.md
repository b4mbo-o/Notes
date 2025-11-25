# notes.b4mboo.net

メインサイトの雰囲気を引き継いだノート / ブログです。Astro + Markdown で、`src/content/posts` にファイルを追加するだけで記事が増えます。

## 開発

```sh
npm install   # 初回だけ（Node 18.17+ / 推奨 20 系）
npm run dev   # http://localhost:4321
npm run build # dist/ に静的ファイルを出力
```

### 検索・人気順について
- 検索: 右上の Search ボタン or `Ctrl/Cmd + K` で検索モーダル。`posts.json`（ビルド時に生成）を client-side で検索します。
- 人気順: ブラウザ内での閲覧回数（localStorage）を使って並べ替えます。全ユーザー集計ではないので、正確な PV を取りたい場合は別途バックエンドや計測基盤が必要です。
- フィード: `/feed`（RSS）を配信。メインサイトの Notes 連携用に `https://notes.b4mboo.net/feed` を参照してください。

## 記事の追加

1. `src/content/posts/` に Markdown を作成（例: `my-note.md`）。
2. フロントマターを入れる:

```md
---
title: "タイトル"
description: "一覧に出す短い説明"
published: "2025-02-21"
tags: ["tag1", "tag2"]
hero: "/images/hero-notes.svg" # 任意
# draft: true   # 下書きにしたい時は true
---

本文を書きます。
```

`draft: true` を付けるとビルドから除外されます。タグページは `tags/<tag>/` に自動生成されます。

## デプロイ

静的サイトなので、GitHub Pages / Cloudflare Pages / Vercel などにそのまま `dist/` を置けば公開できます。
