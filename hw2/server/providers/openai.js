const OpenAI = require('openai');
const { executeTool } = require('../lib/tools/index');

function getClient(userApiKey) {
  const apiKey = userApiKey?.trim() || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set it in Settings or server .env (OPENAI_API_KEY).');
  }
  return new OpenAI({ apiKey });
}

function buildOpenAIContent(msg) {
  if (typeof msg.content === 'string') return msg.content;
  return msg.content.map(p => {
    if (p.type === 'text') return { type: 'text', text: p.text };
    if (p.type === 'image') return { type: 'image_url', image_url: { url: `data:${p.mediaType};base64,${p.data}` } };
    return null;
  }).filter(Boolean);
}

function buildMessages(messages, systemPrompt) {
  const built = [];
  if (systemPrompt) built.push({ role: 'system', content: systemPrompt });
  const recent = messages.slice(-20);
  for (const m of recent) {
    built.push({ role: m.role, content: buildOpenAIContent(m) });
  }
  return built;
}

function emitChunkedText(res, text, chunkSize = 20) {
  if (!text) return;
  for (let i = 0; i < text.length; i += chunkSize) {
    res.write(`data: ${JSON.stringify({ delta: text.slice(i, i + chunkSize) })}\n\n`);
  }
}

async function streamChat({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys }, res) {
  const client = getClient(apiKeys?.openai);
  const builtMessages = buildMessages(messages, systemPrompt);

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

async function streamChatWithTools({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys, tools }, res) {
  const client = getClient(apiKeys?.openai);
  const builtMessages = buildMessages(messages, systemPrompt);
  const toolDefs = tools.map(t => ({ type: 'function', function: t.definition }));
  const isGpt5 = model.startsWith('gpt-5');

  let iterations = 0;
  while (iterations < 10) {
    iterations++;

    const response = await client.chat.completions.create({
      model,
      messages: builtMessages,
      tools: toolDefs,
      tool_choice: 'auto',
      ...(isGpt5
        ? { max_completion_tokens: maxTokens ?? 2048 }
        : { max_tokens: maxTokens ?? 2048 }),
      temperature: temperature ?? 1,
      top_p: topP ?? 1,
    });

    const choice = response.choices[0];
    const msg = choice.message;
    builtMessages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      const text = msg.content ?? '';
      emitChunkedText(res, text);
      break;
    }

    for (const tc of msg.tool_calls) {
      let args = {};
      try { args = JSON.parse(tc.function.arguments); } catch {}
      res.write(`data: ${JSON.stringify({ toolCall: { name: tc.function.name, args } })}\n\n`);

      const result = await executeTool(tc.function.name, args);
      // Truncate large results
      const resultStr = JSON.stringify(result).slice(0, 2000);
      res.write(`data: ${JSON.stringify({ toolResult: { name: tc.function.name, result } })}\n\n`);

      builtMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: resultStr,
      });
    }
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

module.exports = { streamChat, streamChatWithTools };
