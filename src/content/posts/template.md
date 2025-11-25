---
title: "記事タイトル"
description: "一覧に出す短い説明（全角80文字程度まで推奨）"
published: "2025-01-01"
tags: ["startup", "statup"]
hero: "/images/hero-notes.svg"
hidden: true
---

ここに本文を書きます。

- `hidden: true` にしておくと一覧・タグ・フィード・検索に出ません。URL直打ちでのみ表示されます。
- 公開したいときは `hidden: false` に変更し、日付を更新してください。
- `draft: true` も併用できますが、その場合はビルドからも除外されるので URL でも見えなくなります。

```md
---
title: "タイトル"
description: "一覧に出す短い説明"
published: "2025-02-22"
tags: ["tag1"]
hero: "/images/foo.svg"
hidden: false
---
本文
```
