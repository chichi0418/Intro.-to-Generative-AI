const Anthropic = require('@anthropic-ai/sdk');
const { executeTool } = require('../lib/tools/index');

function getClient(userApiKey) {
  const apiKey = userApiKey?.trim() || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Anthropic API key. Set it in Settings or server .env (ANTHROPIC_API_KEY).');
  }
  return new Anthropic({ apiKey });
}

function buildAnthropicContent(msg) {
  if (typeof msg.content === 'string') return msg.content;
  return msg.content.map(p => {
    if (p.type === 'text') return { type: 'text', text: p.text };
    if (p.type === 'image') return { type: 'image', source: { type: 'base64', media_type: p.mediaType, data: p.data } };
    return null;
  }).filter(Boolean);
}

function buildMessages(messages) {
  const recent = messages.slice(-20);
  return recent.map(m => ({ role: m.role, content: buildAnthropicContent(m) }));
}

async function streamChat({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys }, res) {
  const client = getClient(apiKeys?.anthropic);
  const builtMessages = buildMessages(messages);

  const params = {
    model,
    messages: builtMessages,
    max_tokens: maxTokens ?? 2048,
    temperature: temperature ?? 1,
    top_p: topP ?? 1,
    stream: true,
  };
  if (systemPrompt) params.system = systemPrompt;

  const stream = await client.messages.stream(params);

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      const delta = event.delta.text;
      if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

async function streamChatWithTools({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys, tools }, res) {
  const client = getClient(apiKeys?.anthropic);
  const builtMessages = buildMessages(messages);

  const toolDefs = tools.map(t => ({
    name: t.definition.name,
    description: t.definition.description,
    input_schema: t.definition.parameters,
  }));

  let iterations = 0;
  while (iterations < 10) {
    iterations++;

    const params = {
      model,
      messages: builtMessages,
      max_tokens: maxTokens ?? 2048,
      temperature: temperature ?? 1,
      top_p: topP ?? 1,
      tools: toolDefs,
    };
    if (systemPrompt) params.system = systemPrompt;

    const response = await client.messages.create(params);
    builtMessages.push({ role: 'assistant', content: response.content });

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    if (toolUseBlocks.length === 0) {
      // Stream the text content
      const textContent = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
      if (textContent) {
        // Simulate streaming by sending in chunks
        const chunkSize = 20;
        for (let i = 0; i < textContent.length; i += chunkSize) {
          res.write(`data: ${JSON.stringify({ delta: textContent.slice(i, i + chunkSize) })}\n\n`);
        }
      }
      break;
    }

    const toolResults = [];
    for (const block of toolUseBlocks) {
      res.write(`data: ${JSON.stringify({ toolCall: { name: block.name, args: block.input } })}\n\n`);
      const result = await executeTool(block.name, block.input);
      const resultStr = JSON.stringify(result).slice(0, 2000);
      res.write(`data: ${JSON.stringify({ toolResult: { name: block.name, result } })}\n\n`);
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: resultStr });
    }
    builtMessages.push({ role: 'user', content: toolResults });
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

module.exports = { streamChat, streamChatWithTools };
