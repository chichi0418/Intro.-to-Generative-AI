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

router.post('/', async (req, res) => {
  const { model, messages, systemPrompt, temperature, topP, maxTokens, apiKeys } = req.body;

  if (!model || !messages) {
    return res.status(400).json({ error: 'model and messages are required' });
  }

  const provider = getProviderByModel(model);
  if (!provider) {
    return res.status(400).json({ error: 'Unknown model prefix' });
  }

  const usingUserKey = hasUserApiKey(apiKeys, provider);
  const usingServerKey = !usingUserKey && hasServerApiKey(provider);

  if (usingServerKey) {
    const ip = req.ip || 'unknown';
    const quota = await consumeServerKeyQuota(ip);
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

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const params = { messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys };

  try {
    if (provider === 'openai') {
      await openaiProvider.streamChat(params, res);
    } else if (provider === 'anthropic') {
      await anthropicProvider.streamChat(params, res);
    } else if (provider === 'google') {
      await googleProvider.streamChat(params, res);
    } else if (provider === 'xai') {
      await xaiProvider.streamChat(params, res);
    }
  } catch (err) {
    console.error('Provider error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
