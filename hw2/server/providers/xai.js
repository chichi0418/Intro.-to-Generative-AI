const OpenAI = require('openai');
const { executeTool } = require('../lib/tools/index');

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


async function streamChat({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys }, res) {
  const client = getClient(apiKeys?.xai);
  const builtMessages = buildMessages(messages, systemPrompt);

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
    if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

async function streamChatWithTools({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys, tools }, res) {
  const client = getClient(apiKeys?.xai);
  const builtMessages = buildMessages(messages, systemPrompt);
  const toolDefs = tools.map(t => ({ type: 'function', function: t.definition }));

  let iterations = 0;
  while (iterations < 10) {
    iterations++;

    const stream = await client.chat.completions.create({
      model,
      messages: builtMessages,
      tools: toolDefs,
      tool_choice: 'auto',
      max_tokens: maxTokens ?? 2048,
      temperature: temperature ?? 1,
      top_p: topP ?? 1,
      stream: true,
    });

    let textContent = '';
    const toolCallsMap = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        textContent += delta.content;
        res.write(`data: ${JSON.stringify({ delta: delta.content })}\n\n`);
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallsMap[tc.index]) {
            toolCallsMap[tc.index] = { id: '', name: '', argsStr: '' };
          }
          if (tc.id) toolCallsMap[tc.index].id = tc.id;
          if (tc.function?.name) toolCallsMap[tc.index].name += tc.function.name;
          if (tc.function?.arguments) toolCallsMap[tc.index].argsStr += tc.function.arguments;
        }
      }
    }

    const toolCalls = Object.values(toolCallsMap);

    if (toolCalls.length === 0) {
      break;
    }

    builtMessages.push({
      role: 'assistant',
      content: textContent || null,
      tool_calls: toolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.argsStr },
      })),
    });

    for (const tc of toolCalls) {
      let args = {};
      try { args = JSON.parse(tc.argsStr); } catch {}
      res.write(`data: ${JSON.stringify({ toolCall: { name: tc.name, args } })}\n\n`);
      const result = await executeTool(tc.name, args);
      const resultStr = JSON.stringify(result).slice(0, 2000);
      res.write(`data: ${JSON.stringify({ toolResult: { name: tc.name, result } })}\n\n`);
      builtMessages.push({ role: 'tool', tool_call_id: tc.id, content: resultStr });
    }
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

module.exports = { streamChat, streamChatWithTools };
