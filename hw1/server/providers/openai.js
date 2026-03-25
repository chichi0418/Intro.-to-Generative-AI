const OpenAI = require('openai');

function getClient(userApiKey) {
  const apiKey = userApiKey?.trim() || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set it in Settings or server .env (OPENAI_API_KEY).');
  }
  return new OpenAI({ apiKey });
}

async function streamChat({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys }, res) {
  const client = getClient(apiKeys?.openai);
  const builtMessages = [];

  if (systemPrompt) {
    builtMessages.push({ role: 'system', content: systemPrompt });
  }

  // Keep last 20 messages for context
  const recent = messages.slice(-20);
  for (const m of recent) {
    builtMessages.push({ role: m.role, content: m.content });
  }

  const isGpt5 = model.startsWith('gpt-5');
  const stream = await client.chat.completions.create({
    model,
    messages: builtMessages,
    temperature: temperature ?? 1,
    top_p: topP ?? 1,
    ...(isGpt5
      ? { max_completion_tokens: maxTokens ?? 2048 }
      : { max_tokens: maxTokens ?? 2048 }),
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
