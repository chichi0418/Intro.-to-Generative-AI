export interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  duration?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  model: string;
}

export interface SystemInstruction {
  id: string;
  title: string;
  content: string;
}

export interface Settings {
  model: string;
  systemInstructions: SystemInstruction[];
  activeSystemInstructionId: string | null;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface ModelInfo {
  id: string;
  label: string;
  provider: 'openai' | 'anthropic' | 'google' | 'xai';
  badge?: ('Free' | 'New' | 'Paid')[];
  description: string;
  disabled?: boolean;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash Preview',
    provider: 'google',
    badge: ['Free'],
    description: 'Google most intelligent model built for speed, combining frontier intelligence with superior search and grounding.',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    provider: 'google',
    badge: ['Paid'],
    description: 'Mid-size multimodal model with a 2M token context window. Great for complex reasoning tasks.',
  },
  {
    id: 'gpt-5.4',
    label: 'GPT-5.4',
    provider: 'openai',
    badge: ['New', 'Paid'],
    description: "OpenAI's most capable frontier model. Best for complex reasoning, coding, and multi-step agentic tasks.",
  },
  {
    id: 'gpt-5.4-mini',
    label: 'GPT-5.4 Mini',
    provider: 'openai',
    badge: ['New', 'Paid'],
    description: "Smaller, faster variant of GPT-5.4. Great for high-volume coding and agent workflows.",
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    badge: ['Paid'],
    description: "OpenAI's previous flagship model. High intelligence with fast speed, supports text and vision.",
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    badge: ['Paid'],
    description: "Anthropic's most intelligent model. Best for complex tasks requiring nuanced understanding.",
    disabled: true,
  },
  {
    id: 'grok-4-1-fast',
    label: 'Grok 4.1 Fast',
    provider: 'xai',
    badge: ['New', 'Paid'],
    description: "xAI's fast frontier model. High-speed responses with strong reasoning capabilities.",
  },
  {
    id: 'grok-3',
    label: 'Grok 3',
    provider: 'xai',
    badge: ['Paid'],
    description: "xAI's flagship model with deep reasoning and broad knowledge.",
  },
  {
    id: 'grok-3-mini',
    label: 'Grok 3 Mini',
    provider: 'xai',
    badge: ['Paid'],
    description: "Compact and efficient Grok model for everyday tasks.",
  },
];

export const PRESET_INSTRUCTIONS: SystemInstruction[] = [
  {
    id: 'preset:oily-nerd',
    title: '油宅助手',
    content: `你是一位有幫助、可靠、資訊密度高，並帶有輕微油宅氣質的 AI 助手。

風格定位：
- 像一個很懂技術、懂網路文化、懂效率的宅宅朋友。
- 語氣可以自然、有點機智、有點梗，但要克制。
- 核心原則是：有趣可以，但實用優先。

請遵守以下規則：

1. 優先理解使用者真正需求
- 問題清楚就直接回答。
- 問題不清楚就用最短的問題釐清。
- 不要繞圈，不要裝神秘。

2. 回答要實用
- 先給結論，再補細節。
- 優先提供可執行內容：步驟、範例、模板、代碼、清單。
- 面對複雜問題時，先拆解再回答。

3. 不要亂掰
- 不編造事實、來源、數據、功能、外部能力。
- 不確定就明說。
- 不要假裝已經做了實際上沒做的事情。

4. 保持輕油宅風格
- 可偶爾使用自然的宅味表達，例如：
  - 「這題其實是經典套路」
  - 「先別急，我幫你拆」
  - 「這做法比較穩，不容易翻車」
  - 「這波可以直接上」
- 梗只能點綴，不能蓋過內容。
- 禁止低俗、騷擾、噁心油膩、過度發情式語氣。
- 禁止過度角色扮演或每句都像在發廚。

5. 正確處理限制
- 若資訊不足，明確說明缺少什麼。
- 若無法完成，提供最接近的替代方案。
- 除非明確具備能力，否則不要聲稱能存取網站、檔案、即時資料或外部工具。

輸出要求：
- 使用與使用者相同的語言回答，除非另有要求。
- 排版清楚，方便閱讀與複製。
- 預設格式為：先一句話結論，再列重點，必要時補範例。`,
  },
  {
    id: 'preset:concise',
    title: '簡潔模式',
    content: `回答盡可能簡短、直接。不要廢話、不要客套、不要重述問題。直接給答案或步驟。`,
  },
  {
    id: 'preset:code-review',
    title: 'Code Review 專家',
    content: `你是一位資深工程師，專門做 code review。
- 找出潛在 bug、效能問題、安全漏洞。
- 指出可讀性和維護性問題。
- 提供具體的改善建議和範例。
- 用條列方式呈現，每點附上原因。
- 語氣直接，不客套。`,
  },
];

export const DEFAULT_SETTINGS: Settings = {
  model: 'gemini-3-flash-preview',
  systemInstructions: [],
  activeSystemInstructionId: null,
  temperature: 1,
  topP: 1,
  maxTokens: 2048,
};
