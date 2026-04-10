# HW2 — 自製 ChatGPT 網頁 v2

Vite + React + TypeScript 前端、Express 後端、Supabase Postgres。  
在 HW1 基礎上新增：**長期記憶、多模態圖片輸入、自動模型路由、Tool Use（計算機 / 天氣 / 網路搜尋）與 MCP 整合**。

---

## 快速開始

### 最低需求（免費，不需信用卡）

只需 Google AI Studio 的免費 API Key（Gemini 3 Flash Preview），長期記憶需另外設定 Supabase。

```bash
# 1. 複製環境變數範本
cp .env.example .env

# 2. 編輯 .env，至少填入一組 Key（例如 Google）
# GOOGLE_API_KEY=AIza...

# 3. 安裝依賴
npm install && npm --prefix server install && npm --prefix client install

# 4. 啟動
npm run dev
```

瀏覽器開啟 **`http://localhost:5173`**

---

## 功能說明

### HW1 原有功能

| 功能 | 操作方式 |
|------|----------|
| 切換模型 | Settings → 點擊模型卡片 |
| System Prompt | Settings → System instructions |
| 調整參數 | Settings → Temperature / Top P / Max Tokens |
| 自訂 API Key | Settings → API Keys |
| Streaming | 自動生效，文字逐字出現 |
| 短期對話記憶 | 自動保留最近 20 則訊息 |
| 多對話管理 | 左側 sidebar，支援搜尋 / 重新命名 / 匯出 Markdown |
| 使用量限制 | Server key 免費次數限制 |
| Admin 後台 | Settings → Admin Usage |

### HW2 新增功能

#### 長期記憶（Long-term Memory）

每次對話結束後，後端非同步呼叫 LLM 從對話中擷取 0–3 條關於使用者的重要事實，儲存至 Supabase `memories` 表。  
下次對話時，這些記憶會自動注入 system prompt，讓模型跨 session 記住你。

- **啟用條件**：設定 `SUPABASE_POOLER_URL` 或 `SUPABASE_DB_URL`
- **管理介面**：Settings → Long-term Memory（可查看、手動新增、刪除）
- **無 DB 時**：記憶功能靜默停用，其他功能正常

#### 多模態輸入（Multimodal）

在支援視覺的模型下，輸入框右側出現圖片上傳按鈕。

- 支援 PNG / JPG / WebP，每張最大 4MB，每次最多 3 張
- 圖片以 base64 傳送，在對話泡泡中同步顯示預覽
- 支援視覺的模型：GPT-4o、GPT-5.4、GPT-5.4 Mini、Gemini 3 Flash Preview、Gemini 1.5 Pro、Claude 3.5 Sonnet

#### 自動路由（Auto Routing）

Settings → **Auto Route** 開關。

後端根據訊息特徵選擇最適合的模型：

| 條件 | 路由目標 |
|------|----------|
| 訊息含圖片 | 最優先可用的視覺模型（gpt-4o → gemini-3-flash-preview → …） |
| 偵測到搜尋 / 計算 / 天氣意圖 | 支援 tool use 的模型 |
| 一般問答 | 輕量模型（gemini-3-flash-preview） |

路由成功時，助理訊息上方顯示 `Routed → <model>` 標籤。

#### Tool Use

Settings → **Enable Tools** 開關。後端進入工具呼叫循環（最多 10 輪），前端顯示可折疊的工具步驟面板。

| 工具 | 說明 | 需要 Key |
|------|------|----------|
| `calculator` | 安全數學運算（mathjs），支援四則、次方、sqrt、三角函數等 | 否 |
| `get_weather` | 查詢任意城市即時天氣（wttr.in） | 否 |
| `web_search` | 網路搜尋（Tavily API），回傳前 3 筆結果 | `TAVILY_API_KEY` |

#### MCP（Model Context Protocol）

在 `.env` 設定 `MCP_SERVERS`，伺服器啟動時自動 spawn MCP 子程序並透過 JSON-RPC over stdio 註冊外部工具，與內建工具合併後提供給所有模型使用。

```json
MCP_SERVERS=[{"command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/tmp"]}]
```

#### Markdown 語法高亮

程式碼區塊自動套用 highlight.js 語法著色，深色 / 淺色主題自動切換，程式碼右上角有一鍵複製按鈕。

---

## 支援模型

| 模型 | Provider | 費用 | 視覺 | Tool Use |
|------|----------|------|:----:|:--------:|
| **Gemini 3 Flash Preview** | Google | **免費** | ✓ | ✓ |
| Gemini 1.5 Pro | Google | 付費 | ✓ | ✓ |
| GPT-5.4 | OpenAI | 付費 | ✓ | ✓ |
| GPT-5.4 Mini | OpenAI | 付費 | ✓ | ✓ |
| GPT-4o | OpenAI | 付費 | ✓ | ✓ |
| Claude 3.5 Sonnet（目前 UI 停用） | Anthropic | 付費 | ✓ | ✓ |
| Grok 4.1 Fast | xAI | 付費 | — | ✓ |
| Grok 3 | xAI | 付費 | — | ✓ |
| Grok 3 Mini | xAI | 付費 | — | ✓ |

> 註：實際可選模型以 `client/src/types.ts` 的 `AVAILABLE_MODELS`（且 `disabled !== true`）為準。

---

## 系統架構

```
瀏覽器（Vite + React + TypeScript）
  ├── ChatWindow          — 訊息列表（含 Table of Contents）
  ├── InputBar            — 文字輸入 + 圖片上傳
  ├── MessageBubble       — Markdown 渲染、工具步驟展開、路由標籤
  ├── SettingsPanel       — 模型 / 參數 / API Key / 記憶 / 工具開關
  ├── MemoryPanel         — 長期記憶管理
  └── ToolStepsDisplay    — 可折疊工具呼叫紀錄

        ↕  HTTP / SSE（text/event-stream）
           事件類型：delta | routing | toolCall | toolResult | error | [DONE]

Express 後端（Node.js / CommonJS）
  ├── POST /api/chat       — 串流聊天主路由
  │     ├── buildSystemPromptWithMemory()  — 注入長期記憶
  │     ├── resolveModel()                 — Auto Routing
  │     ├── streamChat / streamChatWithTools — 呼叫 LLM
  │     └── extractAndSaveMemories()       — 非同步記憶擷取
  ├── GET/POST/DELETE /api/memory  — 長期記憶 CRUD
  ├── GET/DELETE /api/admin/usage  — 用量查詢 / 重設
  ├── lib/autoRouter.js    — 路由邏輯
  ├── lib/memoryHelper.js  — 記憶 DB 操作 + LLM 擷取
  ├── lib/tools/           — calculator / weather / webSearch
  ├── lib/mcpManager.js    — MCP 子程序管理
  └── providers/           — openai / anthropic / google / xai

        ↕  PostgreSQL（Supabase）

Supabase Postgres
  ├── usage 表    — clientId 使用量（HW1）
  └── memories 表 — 長期記憶（HW2，自動建立）
```

---

## .env 設定

複製 `.env.example` 為 `.env`，填入需要的欄位：

```bash
# LLM Provider Keys（有哪個填哪個）
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
X_API_KEY=xai-...

# Server
PORT=3001
SERVER_KEY_FREE_LIMIT=20
SERVER_KEY_FREE_WINDOW_MS=86400000
ADMIN_API_TOKEN=your-secret-token

# Supabase（長期記憶 + 用量持久化，兩擇一）
SUPABASE_POOLER_URL=postgresql://postgres.<ref>:[pw]@aws-0-<region>.pooler.supabase.com:6543/postgres
SUPABASE_DB_URL=postgresql://postgres:[pw]@db.<ref>.supabase.co:5432/postgres

# Tool Use（選填）
TAVILY_API_KEY=tvly-...   # 啟用 web_search 工具

# MCP（選填）
MCP_SERVERS=[{"command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/tmp"]}]
# 不使用 MCP 時可改為：MCP_SERVERS=[]
```

### 各功能所需最低設定

| 功能 | 最低需求 |
|------|---------|
| 基本聊天 | 任意一個 LLM API Key |
| 長期記憶 | LLM Key + Supabase URL |
| 多模態 | 支援視覺的模型 Key |
| Auto Routing | 任意 LLM Key（自動選可用模型） |
| calculator / get_weather | 任意 LLM Key + Enable Tools |
| web_search | LLM Key + `TAVILY_API_KEY` + Enable Tools |
| MCP 工具 | LLM Key + `MCP_SERVERS` + Enable Tools |

---

## 啟動與開發

```bash
# 同時啟動前後端（推薦）
npm run dev

# 分開啟動
npm run server   # 後端 http://localhost:3001
npm run client   # 前端 http://localhost:5173

# 生產 build
npm run build
```

---

## 部署（GitHub Pages + Render）

### 後端 → Render

1. New Web Service，Root Directory: `server`
2. Build: `npm install`，Start: `node index.js`
3. 填入所有 Environment Variables（見上方 .env 說明）

### 前端 → GitHub Pages

1. `client/.env.production` 填入 Render 網址：
   ```
   VITE_API_URL=https://your-service.onrender.com
   ```
2. 若要用 GitHub Actions 自動部署，請在 repo 建立 `.github/workflows`（本 repo 目前未內建 workflow）
3. GitHub Actions 流程若有讀取 secret，再到 repo → Settings → Secrets 設定 `VITE_API_URL`

---

## 驗收測試

| 測試項目 | 步驟 |
|---------|------|
| Streaming | 發送訊息，確認文字逐字出現 |
| 短期記憶 | 說「我叫 John」→ 問「我叫什麼名字？」 |
| **長期記憶** | 說一件事 → 清除對話 → 開新對話 → 問同一件事，模型仍記得 |
| **多模態** | 上傳圖片並提問，確認模型描述圖片內容 |
| **Auto Route** | 開啟 Auto Route → 傳含圖訊息，確認標籤顯示路由到視覺模型 |
| **Tool: 計算** | 開啟 Enable Tools → 問「123 × 456 是多少？」→ 確認工具步驟展開 |
| **Tool: 天氣** | 問「東京現在天氣如何？」→ 確認 get_weather 工具被呼叫 |
| System Prompt | 設定「只用英文回答」→ 發中文，確認回英文 |
| 語法高亮 | 要求輸出程式碼，確認程式碼有顏色標記 |
| 記憶管理 | Settings → Long-term Memory → 查看、新增、刪除記憶 |

---

## 常見問題（Troubleshooting）

- macOS 上 `/tmp` 通常是 `/private/tmp` 的符號連結。若你的執行環境有嚴格路徑白名單，可能需要把設定中的 `/tmp` 改成 `/private/tmp`（例如 MCP filesystem server 的允許路徑）。
