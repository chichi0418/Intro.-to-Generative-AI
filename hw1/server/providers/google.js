const { GoogleGenerativeAI } = require('@google/generative-ai');

function getClient(userApiKey) {
  const apiKey = userApiKey?.trim() || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Google API key. Set it in Settings or server .env (GOOGLE_API_KEY).');
  }
  return new GoogleGenerativeAI(apiKey);
}

async function streamChat({ messages, systemPrompt, model, temperature, topP, maxTokens, apiKeys }, res) {
  const genAI = getClient(apiKeys?.google);
  const generationConfig = {
    temperature: temperature ?? 1,
    topP: topP ?? 1,
    maxOutputTokens: maxTokens ?? 2048,
  };

  const modelParams = { model, generationConfig, tools: [] };
  if (systemPrompt) {
    modelParams.systemInstruction = systemPrompt;
  }

  const genModel = genAI.getGenerativeModel(modelParams);

  // Keep last 20 messages for context, convert roles
  const recent = messages.slice(-20);
  const lastMessage = recent[recent.length - 1];
  let history = recent.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  // Google requires history to start with 'user'
  while (history.length > 0 && history[0].role !== 'user') {
    history = history.slice(1);
  }

  const chat = genModel.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  for await (const chunk of result.stream) {
    const delta = chunk.text();
    if (delta) {
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }

  res.write(`data: [DONE]\n\n`);
  res.end();
}

module.exports = { streamChat };
