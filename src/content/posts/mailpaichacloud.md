---
title: "mail.paicha.cloud API仕様書"
description: "Temporary Mail UI（mail.paicha.cloud）から逆算したAPI仕様。受信一覧・詳細・添付DL・メールボックス生成を定義。"
published: "2025-12-31"
tags: ["api", "paicha.cloud", "temporary-mail", "mail"]
hero: "/images/hero-notes.svg"
---

本ドキュメントは、mail.paicha.cloud のフロント実装（JavaScript）から逆算した API 仕様で、全部ChatGPTに作らせました。
運営元がAPI仕様書なんてない自分で見ろとか吐かしてきたので置いときます。

---

## 前提 / 共通仕様

### ベースURL
- 同一オリジン配下（例：https://mail.paicha.cloud/）

### エンコーディング
- パスにメールアドレスを含めるため、`{mailbox}` は URLエンコード済み を前提とします。
  - 例：`5626513@hamutan86.jp` → `5626513%40hamutan86.jp`

### フォーマット
- 通常レスポンス：`application/json`
- 例外：**403 の場合、JSON ではなく HTML が返る可能性があります**（ブロックページ表示用途）。

### 日時
- `created_at` はフロント側で `new Date(created_at)` しているため、ISO 8601（UTC）形式推奨。

### 認証 / ブロック挙動（重要）
- フロント実装では、API が `403` を返した場合、レスポンス本文を **HTML として描画**します（`handleForbidden()`）。
- そのため、クライアント実装では **JSON固定**にせず、`status` と `Content-Type` を見て分岐するのが安全です。

---

## エンドポイント一覧

| Method | Path | 概要 |
|---|---|---|
| GET | `/api/{mailbox}` | メール一覧取得（受信トレイ） |
| GET | `/api/mailbox/{mailbox}/mail/{mailId}` | メール詳細取得（本文/HTML/添付） |
| POST | `/change_mailbox` | 新しいメールアドレス生成（ドメイン指定 or 自動選択） |
| GET | `/api/mailbox/{mailbox}/mail/{mailId}/attachment/{index}` | 添付ファイルDL（フォールバック） |

---

## 1) メール一覧取得

### GET `/api/{mailbox}`

指定メールボックスの受信メール一覧を返します。

#### Path Parameters
- `mailbox` (string, required): URLエンコード済みメールアドレス

#### Response: 200 (application/json)
配列で返却。

    [
      {
        "id": 12345,
        "subject": "Welcome",
        "from": "noreply@example.com",
        "created_at": "2025-12-31T12:34:56Z"
      }
    ]

#### Response: 403 (text/html)
ブロックページ HTML を返す可能性あり。

---

## 2) メール詳細取得

### GET `/api/mailbox/{mailbox}/mail/{mailId}`

メール詳細（件名、送信者、本文、HTML本文、添付）を返します。

#### Path Parameters
- `mailbox` (string, required): URLエンコード済みメールアドレス
- `mailId` (string|number, required): メールID（一覧の `id`）

#### Response: 200 (application/json)

    {
      "id": 12345,
      "subject": "Welcome",
      "from": "noreply@example.com",
      "created_at": "2025-12-31T12:34:56Z",
      "html_body": "<p>Hello</p>",
      "body": "Hello",
      "attachments": [
        {
          "index": 0,
          "filename": "file.pdf",
          "size": 204800,
          "download_url": "/api/mailbox/5626513%40hamutan86.jp/mail/12345/attachment/0"
        }
      ]
    }

#### 表示優先順位（フロント挙動）
- `html_body` が存在して非空 → `html_body` を表示
- それ以外 → `body` をプレーンテキストとして表示（URL はリンク化）

#### 添付ファイルURLの扱い
- `attachments[].download_url` が存在する場合はそれを使う
- 無い場合は、フォールバックとして次のURLを組み立てる  
  `/api/mailbox/{mailbox}/mail/{mailId}/attachment/{index}`

#### Response: 403 (text/html)
ブロックページ HTML を返す可能性あり。

---

## 3) メールボックス生成（ドメイン指定 or 自動選択）

### POST `/change_mailbox`

新しいメールアドレスを生成します。  
フロントでは「ドメインを選択して変更」ボタンに紐づいています。

#### Request Body: application/json（ドメイン指定あり）

    {
      "domain": "hamutan86.jp"
    }

#### Response: 200 (application/json)

    {
      "new_email": "9876543@hamutan86.jp",
      "domains": [
        "temporary-mail.paicha.cloud",
        "hamutan86.jp",
        "gmx.com"
      ]
    }

- `new_email`：生成された新アドレス
- `domains`：利用可能ドメイン一覧（返る場合のみUIが候補を更新）

#### ドメイン指定なし（自動選択）について（追加仕様：提案）
現状フロントは必ず `domain` を送っていますが、運用上は「指定なしでランダム生成」をサーバが許可すると便利です。  
互換性の高い案として、次のいずれかを推奨します。

**案A（推奨）：`domain` を省略 / null を許可**
- Request:

      {}

  または

      { "domain": null }

- サーバ側で利用可能ドメインからランダム選択、または重み付き選択。

**案B：`domain` に `"auto"` を許可**
- Request:

      { "domain": "auto" }

どちらでもレスポンスは同じ形式でOKです。

#### Response: 403 (text/html)
ブロックページ HTML を返す可能性あり。

---

## 4) 添付ファイルDL（フォールバック）

### GET `/api/mailbox/{mailbox}/mail/{mailId}/attachment/{index}`

添付ファイルをバイナリで返します。  
`attachments[].download_url` が無い場合に、フロントがフォールバックURLとして使用します。

#### Path Parameters
- `mailbox` (string, required): URLエンコード済みメールアドレス
- `mailId` (string|number, required): メールID
- `index` (number, required): 添付連番（`attachments[].index`）

#### Response: 200 (application/octet-stream)
- バイナリデータ（`Content-Type` は実装により変動）
- `Content-Disposition` でファイル名指定推奨

#### Response: 403 (text/html)
ブロックページ HTML を返す可能性あり。

---

## エラーレスポンス仕様（追加仕様：提案）

現状フロントは `403` だけHTML想定で特殊処理しています。  
それ以外のエラーは `HTTP {status}` として扱うため、APIとしては以下のような統一JSONを提案します（互換性を壊しません）。

### ErrorResponse（application/json）
    {
      "error": {
        "code": "MAILBOX_NOT_FOUND",
        "message": "Mailbox not found",
        "details": {
          "mailbox": "5626513%40hamutan86.jp"
        }
      }
    }

推奨ステータス：
- 400: 入力不正（domain不正、mailbox形式不正など）
- 404: mailbox/mail/attachment が存在しない
- 429: レート制限
- 500: サーバ内部

---

## データモデル（参考）

### MailListItem（参考）
    type MailListItem = {
      id: string | number;
      subject?: string | null;
      from: string;
      created_at: string; // ISO 8601
    };

### Attachment（参考）
    type Attachment = {
      index: number;        // 0以上
      filename?: string | null;
      size?: number | null; // bytes
      download_url?: string | null;
    };

### MailDetail（参考）
    type MailDetail = {
      id?: string | number | null;
      subject?: string | null;
      from: string;
      created_at: string;   // ISO 8601
      html_body?: string | null;
      body?: string | null;
      attachments?: Attachment[];
    };

### ChangeMailboxRequest / Response（参考）
    type ChangeMailboxRequest = { domain?: string | null };

    type ChangeMailboxResponse = {
      new_email: string;
      domains?: string[] | null;
    };

---

## Python 使用事例

以下は mail.paicha.cloud を「APIクライアントとして触る」想定の例です。  
403 のとき HTML が返る可能性があるため、レスポンスの扱いを分岐しています。

### 1) メール一覧を取得する

    import urllib.parse
    import requests

    BASE = "https://mail.paicha.cloud"

    mailbox = "5626513@hamutan86.jp"
    mailbox_enc = urllib.parse.quote(mailbox, safe="")

    r = requests.get(f"{BASE}/api/{mailbox_enc}", timeout=10)

    if r.status_code == 403 and "text/html" in r.headers.get("Content-Type", ""):
        # ブロックページHTML
        html = r.text
        raise RuntimeError("Blocked (403)")

    r.raise_for_status()
    mails = r.json()
    for m in mails:
        print(m.get("id"), m.get("subject"), m.get("from"), m.get("created_at"))

### 2) メール詳細を取得する

    import urllib.parse
    import requests

    BASE = "https://mail.paicha.cloud"

    mailbox = "5626513@hamutan86.jp"
    mail_id = 12345

    mailbox_enc = urllib.parse.quote(mailbox, safe="")
    r = requests.get(f"{BASE}/api/mailbox/{mailbox_enc}/mail/{mail_id}", timeout=10)

    if r.status_code == 403 and "text/html" in r.headers.get("Content-Type", ""):
        raise RuntimeError("Blocked (403)")

    r.raise_for_status()
    data = r.json()

    print("Subject:", data.get("subject"))
    print("From:", data.get("from"))
    print("Created:", data.get("created_at"))

    html_body = (data.get("html_body") or "").strip()
    if html_body:
        print("Has HTML body")
    else:
        print("Body:", data.get("body"))

### 3) 添付ファイルをダウンロードする（download_url 優先 + フォールバック）

    import os
    import urllib.parse
    import requests

    BASE = "https://mail.paicha.cloud"

    mailbox = "5626513@hamutan86.jp"
    mail_id = 12345
    attachment_index = 0

    mailbox_enc = urllib.parse.quote(mailbox, safe="")

    # まず詳細取得
    detail = requests.get(f"{BASE}/api/mailbox/{mailbox_enc}/mail/{mail_id}", timeout=10).json()
    atts = detail.get("attachments") or []
    att = next((a for a in atts if a.get("index") == attachment_index), None)
    if not att:
        raise RuntimeError("Attachment not found in detail")

    url = att.get("download_url") or f"/api/mailbox/{mailbox_enc}/mail/{mail_id}/attachment/{attachment_index}"
    if url.startswith("/"):
        url = BASE + url

    out_name = att.get("filename") or f"attachment-{attachment_index}"
    out_path = os.path.join(".", out_name)

    with requests.get(url, stream=True, timeout=30) as r:
        if r.status_code == 403 and "text/html" in r.headers.get("Content-Type", ""):
            raise RuntimeError("Blocked (403)")
        r.raise_for_status()
        with open(out_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 128):
                if chunk:
                    f.write(chunk)

    print("Saved:", out_path)

### 4) 新しいメールアドレスを生成する（ドメイン指定）

    import requests

    BASE = "https://mail.paicha.cloud"

    r = requests.post(
        f"{BASE}/change_mailbox",
        json={"domain": "hamutan86.jp"},
        timeout=10
    )

    if r.status_code == 403 and "text/html" in r.headers.get("Content-Type", ""):
        raise RuntimeError("Blocked (403)")

    r.raise_for_status()
    data = r.json()
    print("New email:", data["new_email"])
    print("Domains:", data.get("domains"))

### 5) 新しいメールアドレスを生成する（ドメイン自動選択：追加仕様の提案）

    import requests

    BASE = "https://mail.paicha.cloud"

    # 案A: domain省略
    r = requests.post(f"{BASE}/change_mailbox", json={}, timeout=10)
    r.raise_for_status()
    print(r.json()["new_email"])

    # 案B: domain="auto"
    r = requests.post(f"{BASE}/change_mailbox", json={"domain": "auto"}, timeout=10)
    r.raise_for_status()
    print(r.json()["new_email"])

---

## ドメイン選択ポリシー（追加仕様：提案）

UI上のドメイン一覧には「ローカル系」と「リモート系」が混在しています（例：`gmx.com`, `hotmail.com`）。  
フロントはリモート系のみ自動更新間隔を 60秒、それ以外は 10秒にしています。

- remoteDomains: `["gmx.com", "hotmail.com"]`
- auto refresh:
  - remote → 60,000ms
  - others → 10,000ms

この挙動に合わせるなら、サーバ側の自動選択（ランダム）で以下を検討できます。

- **案：高速受信優先**  
  remoteDomains を避けてローカルドメインから選ぶ（UI更新も速い）
- **案：分散/匿名性優先**  
  全体から重み付きランダム（remoteDomains は低めの重み）

---

## 実装上の注意（重要）

- `mailbox` は必ず URL エンコードしてパスに入れる（`@` → `%40`）。
- 403 は JSON ではなく HTML が返る可能性があるため、クライアントは `Content-Type` を見て処理分岐するのが安全。
- 添付DLは `download_url` が返る場合はそれを優先し、無ければフォールバックURLで取得する。
