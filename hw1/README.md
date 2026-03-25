# HW1 — 自製 ChatGPT 網頁

Vite + React 前端、Express 後端，支援 OpenAI / Anthropic / Google 三家 LLM，SSE streaming。

---

## 快速開始（只用免費模型）

**Gemini 2.0 Flash** 完全免費，只需要 Google AI Studio API Key，不需信用卡。

1. 前往 [Google AI Studio](https://aistudio.google.com/apikey) 建立免費 API Key
2. 填入 `.env`（根目錄，複製自 `.env.example`）：
   ```
   GOOGLE_API_KEY=AIza...
   PORT=3001
   ```
3. 安裝並啟動（見下方）

---

## 安裝依賴

```bash
# 根目錄
npm install

# 後端
cd server && npm install && cd ..

# 前端
cd client && npm install && cd ..
```

---

## 啟動方式

### 方式 A：同時啟動前後端（推薦）

```bash
npm run dev
```

等出現以下兩行即表示成功：
```
Server running on port 3001
VITE v6.x.x  ready in xxx ms
```

瀏覽器開啟 **`http://localhost:5173`**

---

### 方式 B：分開啟動（除錯用）

**終端機 1 — 啟動後端：**
```bash
npm run server
# 或直接：
node server/index.js
```
看到 `Server running on port 3001` 表示後端正常。

**終端機 2 — 啟動前端：**
```bash
npm run client
# 或：
cd client && npm run dev
```
看到 `Local: http://localhost:5173` 表示前端正常。

---

## 驗證後端是否正常（不需前端）

```bash
curl -N -X POST http://localhost:3001/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"model":"gemini-2.0-flash","messages":[{"role":"user","content":"hi"}]}'
```

正常輸出長這樣：
```
data: {"delta":"Hi"}
data: {"delta":" there"}
...
data: [DONE]
```

---

## 功能說明

| 功能 | 操作方式 |
|------|----------|
| 切換模型 | 右側面板 → Model 下拉選單 |
| System Prompt | 右側面板 → System Prompt 文字框 |
| 調整參數 | 右側面板 → Temperature / Top P / Max Tokens 滑桿 |
| 自訂 API Key | 右側面板 → API Keys（可填自己的 OpenAI / Anthropic / Google / xAI key） |
| Streaming | 自動生效，文字逐字出現 |
| 對話記憶 | 自動保留最近 20 則訊息傳給後端 |
| 清除對話 | 輸入框右側「Clear」按鈕 |
| 設定持久化 | 設定值自動存入 localStorage，重新整理不會消失 |

---

## 支援模型

| 模型 | Provider | 費用 |
|------|----------|------|
| **Gemini 1.5 Flash** | Google | **免費** |
| GPT-4o | OpenAI | 付費 |
| GPT-4o Mini | OpenAI | 付費 |
| Claude 3.5 Sonnet | Anthropic | 付費 |
| Gemini 1.5 Pro | Google | 付費 |

---

## .env 完整設定（有哪個填哪個）

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
X_API_KEY=xai-...
PORT=3001
SERVER_KEY_FREE_LIMIT=20
SERVER_KEY_FREE_WINDOW_MS=86400000
ADMIN_API_TOKEN=your-secret-token
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres
```

沒有的 Key 留空即可，只要不切換到對應模型就不會報錯。  
也可以不填 `.env`，直接在前端右側 Settings 的 `API Keys (Optional)` 填入自己的 key；前端會隨請求送出並優先使用。

`SERVER_KEY_FREE_LIMIT` / `SERVER_KEY_FREE_WINDOW_MS` 可限制「使用伺服器 key 的免費次數」。  
超過後會顯示通知，並要求使用者改填自己的 API key 才能繼續。

若要查看每個 IP 用量後台，設定 `ADMIN_API_TOKEN`。  
前端 Settings → `Admin Usage` 可輸入 token 查詢 `/api/admin/usage`。

若要把 IP 用量持久化（server 重啟不清空），設定 `SUPABASE_DB_URL`。  
有設定時會寫入 Supabase Postgres；未設定則 fallback 到記憶體。

---

## 驗收測試步驟

1. **Streaming**：發送任何訊息，確認文字逐字出現
2. **Context 記憶**：說「我叫 John」→ 再問「我叫什麼名字？」
3. **System Prompt**：設定「只用英文回答」→ 發中文訊息，確認回英文
4. **Multi-provider**：切換 GPT / Claude / Gemini，各發一則訊息
5. **參數調整**：Temperature 調到 0 → 同樣問題問兩次，確認回答一致

---

## 部署（GitHub Pages + Render）

### 後端部署到 Render
1. 登入 [Render](https://render.com)，建立 New Web Service
2. 連接 GitHub repo，Root Directory 設為 `server`
3. Build Command: `npm install`，Start Command: `node index.js`
4. Environment Variables 設定：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`GOOGLE_API_KEY`、`X_API_KEY`、`SERVER_KEY_FREE_LIMIT`、`SERVER_KEY_FREE_WINDOW_MS`、`ADMIN_API_TOKEN`、`SUPABASE_DB_URL`

### 前端部署到 GitHub Pages
1. 更新 `client/.env.production`，填入 Render 網址：
   ```
   VITE_API_URL=https://your-service.onrender.com
   ```
2. 在 GitHub repo → Settings → Secrets → Actions 新增 `VITE_API_URL`
3. Push to `main` → GitHub Actions 自動 build + 部署
4. 確認可以訪問：`https://chichi0418.github.io/Intro.-to-Generative-AI/`

> GitHub Pages 前端不需要放 Supabase key；只需要 `VITE_API_URL` 指向 Render 後端即可。
