const express = require('express');
const router = express.Router();
const openaiProvider = require('../providers/openai');
const anthropicProvider = require('../providers/anthropic');
const googleProvider = require('../providers/google');
const xaiProvider = require('../providers/xai');
const {
  SERVER_KEY_FREE_LIMIT,
  SERVER_KEY_FREE_WINDOW_MS,
  consumeServerKeyQuota,
} = require('../lib/serverKeyQuota');
const { buildSystemPromptWithMemory, extractAndSaveMemories } = require('../lib/memoryHelper');
const { resolveModel, detectToolIntent } = require('../lib/autoRouter');
const { getAllTools } = require('../lib/tools/index');
const { optionalAuth } = require('../lib/authMiddleware');

function getProviderByModel(model) {
  if (model.startsWith('gpt-')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gemini-')) return 'google';
  if (model.startsWith('grok-')) return 'xai';
  return null;
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

function extractMessageText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter(p => p?.type === 'text' && typeof p.text === 'string')
    .map(p => p.text)
    .join(' ');
}

router.post('/', optionalAuth, async (req, res) => {
  const {
    model: requestedModel,
    messages,
    systemPrompt: rawSystemPrompt,
    temperature,
    topP,
    maxTokens,
    apiKeys,
    clientId,
    autoRoute,
    enableTools,
  } = req.body;

  if (!requestedModel || !messages) {
    return res.status(400).json({ error: 'model and messages are required' });
  }

  // Logged-in users get a stable, cross-device identity
  const effectiveClientId = req.user ? `user:${req.user.userId}` : clientId;

  // Auto routing
  let model = requestedModel;
  let routingMeta = null;
  if (autoRoute) {
    const routing = resolveModel({ messages, requestedModel, apiKeys });
    model = routing.model;
    if (routing.wasRouted) {
      routingMeta = { routedModel: model, reason: routing.reason };
    }
  }

  const provider = getProviderByModel(model);
  if (!provider) {
    return res.status(400).json({ error: 'Unknown model prefix' });
  }

  const usingUserKey = hasUserApiKey(apiKeys, provider);
  const usingServerKey = !usingUserKey && hasServerApiKey(provider);

  if (usingServerKey) {
    const normalizedClientId = typeof effectiveClientId === 'string' ? effectiveClientId.trim() : '';
    const usageKey = normalizedClientId ? `client:${normalizedClientId.slice(0, 128)}` : `ip:${req.ip || 'unknown'}`;
    const quota = await consumeServerKeyQuota(usageKey);
    if (!quota.allowed) {
      const windowHours = Math.round(SERVER_KEY_FREE_WINDOW_MS / (60 * 60 * 1000) * 10) / 10;
      return res.status(429).json({
        code: 'SERVER_API_KEY_QUOTA_EXCEEDED',
        error: `You have used all ${SERVER_KEY_FREE_LIMIT} free requests in ${windowHours} hour(s). Please add your own API key in Settings to continue.`,
        quota: {
          limit: SERVER_KEY_FREE_LIMIT,
          resetAt: quota.resetAt,
          windowMs: SERVER_KEY_FREE_WINDOW_MS,
        },
      });
    }
  }

  // Inject long-term memory into system prompt, but do not block response start too long.
  const baseSystemPrompt = rawSystemPrompt || '';
  const systemPrompt = await Promise.race([
    buildSystemPromptWithMemory(baseSystemPrompt, effectiveClientId),
    new Promise(resolve => setTimeout(() => resolve(baseSystemPrompt), 1200)),
  ]);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  res.write(': connected\n\n');

  // Emit routing metadata before any delta
  if (routingMeta) {
    res.write(`data: ${JSON.stringify({ routing: routingMeta })}\n\n`);
  }

  const availableTools = enableTools ? getAllTools() : [];
  const lastMessage = messages[messages.length - 1];
  const lastText = extractMessageText(lastMessage?.content);
  const shouldUseTools = Boolean(enableTools && availableTools.length > 0 && detectToolIntent(lastText));
  const tools = shouldUseTools ? availableTools : [];
  const params = { messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys, tools };

  try {
    if (provider === 'openai') {
      if (enableTools && tools.length > 0) {
        await openaiProvider.streamChatWithTools(params, res);
      } else {
        await openaiProvider.streamChat(params, res);
      }
    } else if (provider === 'anthropic') {
      if (enableTools && tools.length > 0) {
        await anthropicProvider.streamChatWithTools(params, res);
      } else {
        await anthropicProvider.streamChat(params, res);
      }
    } else if (provider === 'google') {
      if (enableTools && tools.length > 0) {
        await googleProvider.streamChatWithTools(params, res);
      } else {
        await googleProvider.streamChat(params, res);
      }
    } else if (provider === 'xai') {
      if (enableTools && tools.length > 0) {
        await xaiProvider.streamChatWithTools(params, res);
      } else {
        await xaiProvider.streamChat(params, res);
      }
    }

    // Fire-and-forget memory extraction after response
    if (effectiveClientId) {
      res.on('finish', () => {
        extractAndSaveMemories(effectiveClientId, messages, apiKeys, model).catch(() => {});
      });
    }
  } catch (err) {
    console.error('Provider error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
