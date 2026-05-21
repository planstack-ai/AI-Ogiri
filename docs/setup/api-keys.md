# API キー・OAuth 設定ガイド

本アプリで必要な外部サービスのキー取得・設定手順をまとめています。

## 目次

- [Google OAuth（ログイン用）](#google-oauthログイン用)
- [GitHub OAuth（ログイン用）](#github-oauthログイン用)
- [OpenAI API](#openai-api)
- [Google Gemini API](#google-gemini-api)
- [Anthropic API](#anthropic-api)
- [DeepSeek API](#deepseek-api)
- [xAI API](#xai-api)

---

## Google OAuth（ログイン用）

Google アカウントでのログインに使用します。

### 1. Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または **New Project** で新規作成）

### 2. OAuth 同意画面の設定

1. **APIs & Services** → **OAuth consent screen** に移動
2. **User Type**: **External** を選択 → **Create**
3. 以下を入力:
   - **App name**: `AI大喜利グランプリ`（任意）
   - **User support email**: 自分のメールアドレス
   - **Developer contact information**: 自分のメールアドレス
4. **Save and Continue** で進み、Scopes と Test users はスキップ可
5. **公開ステータスが「テスト」の場合**: Test users に自分の Google アカウントを追加する

### 3. OAuth クライアント ID の作成

1. **APIs & Services** → **Credentials** に移動
2. **Create Credentials** → **OAuth client ID**
3. 以下を設定:
   - **Application type**: `Web application`
   - **Name**: `AI大喜利グランプリ`（任意）
   - **Authorized redirect URIs**: Supabase の Project URL に `/auth/v1/callback` を付けた URL
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
4. **Create** をクリック
5. **Client ID** と **Client Secret** を控える

### 4. Supabase に登録

1. Supabase Dashboard → **Authentication** → **Providers**
2. **Google** を展開し有効化
3. **Client ID** と **Client Secret** を入力 → **Save**

---

## GitHub OAuth（ログイン用）

GitHub アカウントでのログインに使用します。

### 1. OAuth App の作成

1. [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) にアクセス
2. **New OAuth App** をクリック
3. 以下を入力:
   - **Application name**: `AI大喜利グランプリ`（任意）
   - **Homepage URL**: `http://localhost:3000`（本番では実際のドメイン）
   - **Authorization callback URL**: Supabase の Project URL に `/auth/v1/callback` を付けた URL
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
4. **Register application** をクリック

### 2. キーの取得

1. 作成した App のページで **Client ID** を控える
2. **Generate a new client secret** をクリック → 表示された **Client Secret** を控える（この画面でしか確認できません）

### 3. Supabase に登録

1. Supabase Dashboard → **Authentication** → **Providers**
2. **GitHub** を展開し有効化
3. **Client ID** と **Client Secret** を入力 → **Save**

---

## OpenAI API

ChatGPT（既定値: `gpt-5.5`）の回答生成と AI 審査員に使用します。

### キーの取得

1. [OpenAI Platform](https://platform.openai.com/) にアクセスしてサインイン
2. 右上のアイコン → **API keys** に移動（または [直接リンク](https://platform.openai.com/api-keys)）
3. **Create new secret key** をクリック
4. 名前を付けて **Create secret key** → 表示されたキーをコピー（この画面でしか確認できません）

### .env.local への設定

```
OPENAI_API_KEY=sk-...
# 任意: モデルを固定・更新したい場合
OPENAI_ANSWER_MODEL=gpt-5.5
OPENAI_JUDGE_MODEL=gpt-5.5
OPENAI_TOPIC_MODEL=gpt-5.5
```

### 注意事項

- 利用にはクレジット（残高）が必要です。**Billing** → **Add payment method** で支払い方法を設定してください
- モデルを差し替える場合は `OPENAI_ANSWER_MODEL`、`OPENAI_JUDGE_MODEL`、`OPENAI_TOPIC_MODEL` を設定してください

---

## Google Gemini API

Gemini（既定値: `gemini-3.1-pro-preview`）の回答生成に使用します。

### キーの取得

1. [Google AI Studio](https://aistudio.google.com/) にアクセスしてサインイン
2. 左サイドバーまたはヘッダーの **Get API key** をクリック（または [直接リンク](https://aistudio.google.com/apikey)）
3. **Create API key** をクリック
4. プロジェクトを選択して **Create API key in existing project**
5. 表示されたキーをコピー

### .env.local への設定

```
GEMINI_API_KEY=AIza...
# 任意: モデルを固定・更新したい場合
GEMINI_MODEL=gemini-3.1-pro-preview
```

### 注意事項

- 無料枠があります（レート制限あり）
- Google Cloud のプロジェクトに紐づくため、Google OAuth と同じプロジェクトを使うと管理しやすいです

---

## Anthropic API

Claude（既定値: `claude-opus-4-7`）の回答生成に使用します。

### キーの取得

1. [Anthropic Console](https://console.anthropic.com/) にアクセスしてサインイン
2. **Settings** → **API keys** に移動
3. **Create Key** をクリック
4. 名前を付けて作成 → 表示されたキーをコピー（この画面でしか確認できません）

### .env.local への設定

```
ANTHROPIC_API_KEY=sk-ant-...
# 任意: モデルを固定・更新したい場合
CLAUDE_MODEL=claude-opus-4-7
```

### 注意事項

- 利用にはクレジットの購入が必要です。**Plans & Billing** で支払い方法を設定してください

---

## DeepSeek API

DeepSeek（既定値: `deepseek-v4-pro`）の回答生成に使用します。OpenAI 互換の API です。

### キーの取得

1. [DeepSeek Platform](https://platform.deepseek.com/) にアクセスしてサインイン
2. 左サイドバーの **API keys** に移動
3. **Create new API key** をクリック
4. 表示されたキーをコピー

### .env.local への設定

```
DEEPSEEK_API_KEY=sk-...
# 任意: モデルを固定・更新したい場合
DEEPSEEK_MODEL=deepseek-v4-pro
```

### 注意事項

- 利用にはチャージが必要です。**Top up** から残高を追加してください

---

## xAI API

xAI Grok（既定値: `grok-4.3`）の回答生成と、お題生成時の Web Search 付き候補生成に使用します。OpenAI 互換の API です。

### キーの取得

1. [xAI Console](https://console.x.ai/) にアクセスしてサインイン
2. **API Keys** に移動
3. 新しい API キーを作成
4. 表示されたキーをコピー

### .env.local への設定

```
XAI_API_KEY=xai-...
# 任意: モデルを固定・更新したい場合
XAI_MODEL=grok-4.3
```

### 注意事項

- 利用には請求設定が必要です。xAI Console で課金設定、モデルアクセス、Web Search tool の利用可否を確認してください

---

## 設定の確認

すべてのキーを `.env.local` に設定したら、開発サーバーを起動して動作確認します。

```bash
npm run dev
```

1. `http://localhost:3000` → **ログイン** → Google / GitHub でログインできることを確認
2. お題を投稿して、5つの AI モデルすべてが回答を生成することを確認
