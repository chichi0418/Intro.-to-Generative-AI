const VISION_MODELS = ['gpt-4o', 'gemini-3-flash-preview', 'gemini-1.5-pro', 'gpt-5.4'];
const TOOL_MODELS   = ['gpt-4o', 'gemini-3-flash-preview', 'gpt-5.4'];
const LIGHT_MODELS  = ['gemini-3-flash-preview'];

const TOOL_INTENT_PATTERNS = [
  /\b(search|look up|google|find out|what is the (current|latest|today))\b/i,
  /\b(weather|forecast|temperature|rain|sunny|humidity)\b/i,
  /\b(calculate|compute|evaluate|solve|math|equation)\b/i,
  /\b(list|show|read|open|find|search)\s+(files?|folders?|directories?|directory|path)\b/i,
  /\b(file|folder|directory|filesystem|mcp|tmp|\/tmp|\/private\/tmp)\b/i,
  /\b(tool|function call)\b/i,
  /(搜尋|搜索|上網查|查(一下)?(天氣|氣溫|溫度|價格|匯率|新聞|資料)|最新(消息|新聞|價格|匯率)?|即時(資訊|消息|天氣)?)/,
  /(天氣|氣溫|溫度|降雨|濕度|預報)/,
  /(計算|算一下|數學|方程|公式)/,
  /(列出|看看|顯示|讀取|打開|搜尋).*(檔案|文件|資料夾|目錄|路徑)/,
  /(檔案系統|資料夾|目錄|路徑|MCP|\/tmp|\/private\/tmp)/,
  /\/[A-Za-z0-9._\-\/]+/,
  /[0-9０-９]+\s*[+\-*/^×÷]\s*[0-9０-９]+/,
  /\d+\s*[\+\-\*\/\^]\s*\d+/,
];

function detectToolIntent(text) {
  if (!text || typeof text !== 'string') return false;
  return TOOL_INTENT_PATTERNS.some(re => re.test(text));
}

function hasUserApiKey(apiKeys, provider) {
  return Boolean(apiKeys?.[provider]?.trim());
}

function hasServerApiKey(provider) {
  if (provider === 'openai') return Boolean(process.env.OPENAI_API_KEY?.trim());
  if (provider === 'anthropic') return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  if (provider === 'google') return Boolean(process.env.GOOGLE_API_KEY?.trim());
  if (provider === 'xai') return Boolean(process.env.X_API_KEY?.trim() || process.env.XAI_API_KEY?.trim());
  return false;
}

function getProviderByModel(model) {
  if (model.startsWith('gpt-')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gemini-')) return 'google';
  if (model.startsWith('grok-')) return 'xai';
  return null;
}

function pickAvailableModel(candidates, apiKeys) {
  for (const m of candidates) {
    const provider = getProviderByModel(m);
    if (!provider) continue;
    if (hasUserApiKey(apiKeys, provider) || hasServerApiKey(provider)) return m;
  }
  return candidates[0]; // fallback even if no key
}

function resolveModel({ messages, requestedModel, apiKeys }) {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return { model: requestedModel, wasRouted: false, reason: 'no-message' };

  const hasImage = Array.isArray(lastMessage.content) &&
    lastMessage.content.some(p => p.type === 'image');

  const text = typeof lastMessage.content === 'string'
    ? lastMessage.content
    : (lastMessage.content ?? []).filter(p => p.type === 'text').map(p => p.text).join(' ');

  const hasToolIntent = detectToolIntent(text);

  if (hasImage) {
    const model = pickAvailableModel(VISION_MODELS, apiKeys);
    return { model, wasRouted: model !== requestedModel, reason: 'image-input' };
  }

  if (hasToolIntent) {
    const model = pickAvailableModel(TOOL_MODELS, apiKeys);
    return { model, wasRouted: model !== requestedModel, reason: 'tool-intent' };
  }

  const model = pickAvailableModel(LIGHT_MODELS, apiKeys);
  return { model, wasRouted: model !== requestedModel, reason: 'lightweight' };
}

module.exports = { resolveModel, detectToolIntent };
