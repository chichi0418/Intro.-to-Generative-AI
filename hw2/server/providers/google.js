const { GoogleGenerativeAI } = require('@google/generative-ai');
const { executeTool } = require('../lib/tools/index');

function getClient(userApiKey) {
  const apiKey = userApiKey?.trim() || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Google API key. Set it in Settings or server .env (GOOGLE_API_KEY).');
  }
  return new GoogleGenerativeAI(apiKey);
}

function buildGoogleParts(msg) {
  if (typeof msg.content === 'string') return [{ text: msg.content }];
  return msg.content.map(p => {
    if (p.type === 'text') return { text: p.text };
    if (p.type === 'image') return { inlineData: { mimeType: p.mediaType, data: p.data } };
    return null;
  }).filter(Boolean);
}

async function streamChat({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys }, res) {
  const genAI = getClient(apiKeys?.google);
  const generationConfig = {
    temperature: temperature ?? 1,
    topP: topP ?? 1,
    maxOutputTokens: maxTokens ?? 2048,
  };

  const modelParams = { model, generationConfig };
  if (systemPrompt) modelParams.systemInstruction = systemPrompt;

  const genModel = genAI.getGenerativeModel(modelParams);

  // Keep last 20 messages for context, convert roles
  const recent = messages.slice(-20);
  const lastMessage = recent[recent.length - 1];
  let history = recent.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: buildGoogleParts(m),
  }));
  // Google requires history to start with 'user'
  while (history.length > 0 && history[0].role !== 'user') {
    history = history.slice(1);
  }

  const chat = genModel.startChat({ history });
  const result = await chat.sendMessageStream(buildGoogleParts(lastMessage));

  for await (const chunk of result.stream) {
    const delta = chunk.text();
    if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

async function streamChatWithTools({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys, tools }, res) {
  const genAI = getClient(apiKeys?.google);
  const generationConfig = {
    temperature: temperature ?? 1,
    topP: topP ?? 1,
    maxOutputTokens: maxTokens ?? 2048,
  };

  const toolDefs = [{
    functionDeclarations: tools.map(t => ({
      name: t.definition.name,
      description: t.definition.description,
      parameters: t.definition.parameters,
    })),
  }];

  const modelParams = { model, generationConfig, tools: toolDefs };
  if (systemPrompt) modelParams.systemInstruction = systemPrompt;

  const genModel = genAI.getGenerativeModel(modelParams);

  const recent = messages.slice(-20);
  const lastMessage = recent[recent.length - 1];
  let history = recent.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: buildGoogleParts(m),
  }));
  while (history.length > 0 && history[0].role !== 'user') {
    history = history.slice(1);
  }

  const chat = genModel.startChat({ history });
  let currentParts = buildGoogleParts(lastMessage);

  let iterations = 0;
  while (iterations < 10) {
    iterations++;
    const result = await chat.sendMessage(currentParts);
    const response = result.response;

    const functionCalls = response.functionCalls?.() ?? [];
    if (!functionCalls || functionCalls.length === 0) {
      // Stream final text
      const text = response.text();
      if (text) {
        const chunkSize = 20;
        for (let i = 0; i < text.length; i += chunkSize) {
          res.write(`data: ${JSON.stringify({ delta: text.slice(i, i + chunkSize) })}\n\n`);
        }
      }
      break;
    }

    const functionResponses = [];
    for (const fc of functionCalls) {
      res.write(`data: ${JSON.stringify({ toolCall: { name: fc.name, args: fc.args } })}\n\n`);
      const toolResult = await executeTool(fc.name, fc.args);
      res.write(`data: ${JSON.stringify({ toolResult: { name: fc.name, result: toolResult } })}\n\n`);
      functionResponses.push({
        functionResponse: {
          name: fc.name,
          response: { result: JSON.stringify(toolResult).slice(0, 2000) },
        },
      });
    }
    currentParts = functionResponses;
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

module.exports = { streamChat, streamChatWithTools };
