const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function streamChat({ messages, systemPrompt, model, temperature, topP, maxTokens }, res) {
  // Keep last 20 messages for context
  const recent = messages.slice(-20);
  const builtMessages = recent.map(m => ({ role: m.role, content: m.content }));

  const params = {
    model,
    messages: builtMessages,
    max_tokens: maxTokens ?? 2048,
    temperature: temperature ?? 1,
    top_p: topP ?? 1,
    stream: true,
  };

  if (systemPrompt) {
    params.system = systemPrompt;
  }

  const stream = await client.messages.stream(params);

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      const delta = event.delta.text;
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

module.exports = { streamChat };
