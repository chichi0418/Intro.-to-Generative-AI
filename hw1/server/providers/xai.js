const OpenAI = require('openai');

function getClient(userApiKey) {
  const apiKey = userApiKey?.trim() || process.env.X_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing xAI API key. Set it in Settings or server .env (X_API_KEY).');
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.x.ai/v1',
  });
}

async function streamChat({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys }, res) {
  const client = getClient(apiKeys?.xai);
  const builtMessages = [];

  if (systemPrompt) {
    builtMessages.push({ role: 'system', content: systemPrompt });
  }

  const recent = messages.slice(-20);
  for (const m of recent) {
    builtMessages.push({ role: m.role, content: m.content });
  }

  const stream = await client.chat.completions.create({
    model,
    messages: builtMessages,
    temperature: temperature ?? 1,
    top_p: topP ?? 1,
    max_tokens: maxTokens ?? 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

module.exports = { streamChat };
