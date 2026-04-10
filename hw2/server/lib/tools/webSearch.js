module.exports = {
  definition: {
    name: 'web_search',
    description: 'Search the web for current information, news, or facts.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
  },
  execute: async ({ query }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return { error: 'Web search is not configured on this server. Set TAVILY_API_KEY in .env to enable.' };
    }
    try {
      const resp = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, query, max_results: 3 }),
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) return { error: `Search API returned ${resp.status}` };
      const data = await resp.json();
      return {
        query,
        results: (data.results ?? []).slice(0, 3).map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 400) ?? '',
        })),
      };
    } catch (err) {
      return { error: err.message || 'Web search failed' };
    }
  },
};
