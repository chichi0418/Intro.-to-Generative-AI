const OpenAI = require('openai');

let client;
function getClient() {
  if (!client) client = new OpenAI({
    apiKey: process.env.X_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
  return client;
}

async function streamChat({ messages, systemPrompt, model, temperature, topP, maxTokens }, res) {
  const client = getClient();
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
