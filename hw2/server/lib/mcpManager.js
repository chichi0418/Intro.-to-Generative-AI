const { spawn } = require('child_process');

let mcpTools = [];
let mcpProcesses = [];

function normalizeTmpPrefix(path) {
  if (typeof path !== 'string') return path;
  if (path === '/tmp') return '/private/tmp';
  if (path.startsWith('/tmp/')) return `/private${path}`;
  return path;
}

function shouldNormalizePathArgs(toolName) {
  if (!toolName) return false;
  return /(file|filesystem|directory|path|read|write|list|move|copy|delete)/i.test(toolName);
}

function normalizeToolArgsForSandbox(toolName, args) {
  if (!args || typeof args !== 'object' || !shouldNormalizePathArgs(toolName)) return args ?? {};

  const walk = (value, key) => {
    if (Array.isArray(value)) return value.map(v => walk(v, key));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = walk(v, k);
      return out;
    }
    if (typeof value === 'string') {
      const looksLikePathKey = typeof key === 'string' && /(path|file|dir|directory|cwd|root|target|source|destination)/i.test(key);
      if (looksLikePathKey || value === '/tmp' || value.startsWith('/tmp/')) {
        return normalizeTmpPrefix(value);
      }
    }
    return value;
  };

  return walk(args, null);
}

function sendJsonRpc(proc, method, params, id) {
  return new Promise((resolve, reject) => {
    const request = JSON.stringify({ jsonrpc: '2.0', id, method, params: params ?? {} }) + '\n';
    let buffer = '';

    const handler = (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (msg.id === id) {
            proc.stdout.off('data', handler);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        } catch {}
      }
      buffer = lines[lines.length - 1];
    };

    proc.stdout.on('data', handler);
    proc.stdin.write(request);

    setTimeout(() => {
      proc.stdout.off('data', handler);
      reject(new Error('MCP timeout'));
    }, 5000);
  });
}

async function initMcp() {
  const raw = process.env.MCP_SERVERS;
  if (!raw) return;

  let servers;
  try {
    servers = JSON.parse(raw);
  } catch {
    console.error('Invalid MCP_SERVERS JSON');
    return;
  }

  for (const srv of servers) {
    try {
      const proc = spawn(srv.command, srv.args ?? [], {
        env: { ...process.env, ...srv.env },
        stdio: ['pipe', 'pipe', 'inherit'],
      });

      // List available tools
      const result = await sendJsonRpc(proc, 'tools/list', {}, 1);
      const tools = result?.tools ?? [];

      for (const t of tools) {
        mcpTools.push({
          definition: {
            name: t.name,
            description: t.description ?? '',
            parameters: t.inputSchema ?? { type: 'object', properties: {} },
          },
          execute: async (args) => {
            const normalizedArgs = normalizeToolArgsForSandbox(t.name, args);
            const res = await sendJsonRpc(proc, 'tools/call', { name: t.name, arguments: normalizedArgs }, Date.now());
            return res?.content?.[0]?.text ?? res;
          },
        });
      }

      mcpProcesses.push(proc);
      console.log(`MCP: registered ${tools.length} tools from ${srv.command}`);
    } catch (err) {
      console.error(`MCP init failed for ${srv.command}:`, err.message);
    }
  }

  // Graceful cleanup
  function cleanup() {
    for (const proc of mcpProcesses) {
      try { proc.kill(); } catch {}
    }
  }
  process.once('SIGTERM', cleanup);
  process.once('SIGINT', cleanup);
}

function getMcpTools() {
  return mcpTools;
}

module.exports = { initMcp, getMcpTools };
