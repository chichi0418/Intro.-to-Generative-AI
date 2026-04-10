const { getDbPool, ensureMemoriesTable, handleDbError } = require('./db');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function getMemories(clientId) {
  const pool = getDbPool();
  if (!pool) return [];
  try {
    await ensureMemoriesTable();
    const result = await pool.query(
      'SELECT id, client_id, content, created_at FROM memories WHERE client_id = $1 ORDER BY created_at DESC LIMIT 20',
      [clientId]
    );
    return result.rows.map(r => ({ id: r.id, clientId: r.client_id, content: r.content, createdAt: r.created_at }));
  } catch (err) {
    handleDbError(err, 'getMemories');
    console.error('getMemories error:', err.message);
    return [];
  }
}

async function addMemory(clientId, content) {
  const pool = getDbPool();
  if (!pool) return null;
  try {
    await ensureMemoriesTable();
    const result = await pool.query(
      'INSERT INTO memories (client_id, content) VALUES ($1, $2) RETURNING id, client_id, content, created_at',
      [clientId, content.trim()]
    );
    const r = result.rows[0];
    return { id: r.id, clientId: r.client_id, content: r.content, createdAt: r.created_at };
  } catch (err) {
    handleDbError(err, 'addMemory');
    console.error('addMemory error:', err.message);
    return null;
  }
}

async function deleteMemory(id, clientId) {
  const pool = getDbPool();
  if (!pool) return false;
  try {
    const result = await pool.query(
      'DELETE FROM memories WHERE id = $1 AND client_id = $2',
      [id, clientId]
    );
    return result.rowCount > 0;
  } catch (err) {
    handleDbError(err, 'deleteMemory');
    console.error('deleteMemory error:', err.message);
    return false;
  }
}

async function buildSystemPromptWithMemory(systemPrompt, clientId) {
  if (!clientId) return systemPrompt;
  const memories = await getMemories(clientId);
  if (!memories.length) return systemPrompt;
  const block = memories.map(m => `- ${m.content}`).join('\n');
  const memSection = `### Long-term memory (facts about this user):\n${block}`;
  return systemPrompt ? `${systemPrompt}\n\n${memSection}` : memSection;
}

async function extractAndSaveMemories(clientId, messages, apiKeys, model) {
  if (!clientId || !getDbPool()) return;
  try {
    // Build a compact conversation summary (last 6 messages)
    const recent = messages.slice(-6);
    const convo = recent.map(m => {
      const text = typeof m.content === 'string'
        ? m.content
        : m.content.filter(p => p.type === 'text').map(p => p.text).join(' ');
      return `${m.role}: ${text.slice(0, 300)}`;
    }).join('\n');

    const prompt = `Extract 0–3 important facts about the USER from this conversation (not about the assistant).
Facts should be personal preferences, names, locations, goals, or key context the user mentioned.
Return ONLY bullet points (one per line, starting with "- "), or nothing if there are no facts worth remembering.

Conversation:
${convo}`;

    let responseText = '';

    // Determine which provider to use based on the model being used for chat
    let provider = 'google';
    if (model?.startsWith('gpt-')) provider = 'openai';
    else if (model?.startsWith('grok-')) provider = 'xai';
    else if (model?.startsWith('claude-')) provider = 'anthropic';
    else if (model?.startsWith('gemini-')) provider = 'google';

    if (provider === 'openai') {
      const apiKey = apiKeys?.openai?.trim() || process.env.OPENAI_API_KEY;
      if (!apiKey) return;
      const client = new OpenAI({ apiKey });
      const resp = await Promise.race([
        client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
      responseText = resp.choices?.[0]?.message?.content ?? '';
    } else if (provider === 'xai') {
      const apiKey = apiKeys?.xai?.trim() || process.env.X_API_KEY || process.env.XAI_API_KEY;
      if (!apiKey) return;
      const client = new OpenAI({ apiKey, baseURL: 'https://api.x.ai/v1' });
      const resp = await Promise.race([
        client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
      responseText = resp.choices?.[0]?.message?.content ?? '';
    } else if (provider === 'anthropic') {
      const Anthropic = require('@anthropic-ai/sdk');
      const apiKey = apiKeys?.anthropic?.trim() || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return;
      const client = new Anthropic.default({ apiKey });
      const resp = await Promise.race([
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
      responseText = resp.content?.[0]?.text ?? '';
    } else {
      const apiKey = apiKeys?.google?.trim() || process.env.GOOGLE_API_KEY;
      if (!apiKey) return;
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite', generationConfig: { maxOutputTokens: 200, temperature: 0 } });
      const resp = await Promise.race([
        genModel.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
      responseText = resp.response?.text() ?? '';
    }

    const facts = responseText
      .split('\n')
      .map(l => l.replace(/^[-•*]\s*/, '').trim())
      .filter(l => l.length > 5 && l.length < 300);

    for (const fact of facts.slice(0, 3)) {
      await addMemory(clientId, fact);
    }
  } catch (err) {
    // Fire-and-forget — silently ignore errors
    if (err.message !== 'timeout') console.error('extractAndSaveMemories error:', err.message);
  }
}

module.exports = { getMemories, addMemory, deleteMemory, buildSystemPromptWithMemory, extractAndSaveMemories };
