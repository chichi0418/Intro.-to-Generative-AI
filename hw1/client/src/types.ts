export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Settings {
  model: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface ModelInfo {
  id: string;
  label: string;
  provider: 'openai' | 'anthropic' | 'google';
  badge?: 'Free' | 'New' | 'Paid';
  description: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash Preview',
    provider: 'google',
    badge: 'Free',
    description: 'Google most intelligent model built for speed, combining frontier intelligence with superior search and grounding.',
  },
  {
    id: 'gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash Lite',
    provider: 'google',
    badge: 'Free',
    description: 'Most cost-efficient Gemini model, optimized for high-volume tasks with low latency.',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    provider: 'google',
    badge: 'Paid',
    description: 'Mid-size multimodal model with a 2M token context window. Great for complex reasoning tasks.',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    badge: 'Paid',
    description: "OpenAI's flagship model. High intelligence with fast speed, supports text and vision.",
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'openai',
    badge: 'Paid',
    description: "OpenAI's affordable small model that's smarter and cheaper than GPT-3.5 Turbo.",
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    badge: 'Paid',
    description: "Anthropic's most intelligent model. Best for complex tasks requiring nuanced understanding.",
  },
];

export const DEFAULT_SETTINGS: Settings = {
  model: 'gemini-3-flash-preview',
  systemPrompt: '',
  temperature: 1,
  topP: 1,
  maxTokens: 2048,
};
