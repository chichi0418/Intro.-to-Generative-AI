const express = require('express');
const router = express.Router();
const openaiProvider = require('../providers/openai');
const anthropicProvider = require('../providers/anthropic');
const googleProvider = require('../providers/google');
const xaiProvider = require('../providers/xai');

router.post('/', async (req, res) => {
  const { model, messages, systemPrompt, temperature, topP, maxTokens } = req.body;

  if (!model || !messages) {
    return res.status(400).json({ error: 'model and messages are required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const params = { messages, systemPrompt, model, temperature, topP, maxTokens };

  try {
    if (model.startsWith('gpt-')) {
      await openaiProvider.streamChat(params, res);
    } else if (model.startsWith('claude-')) {
      await anthropicProvider.streamChat(params, res);
    } else if (model.startsWith('gemini-')) {
      await googleProvider.streamChat(params, res);
    } else if (model.startsWith('grok-')) {
      await xaiProvider.streamChat(params, res);
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Unknown model prefix' })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error('Provider error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
