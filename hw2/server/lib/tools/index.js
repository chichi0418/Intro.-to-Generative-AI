const calculator = require('./calculator');
const weather = require('./weather');
const webSearch = require('./webSearch');
const { getMcpTools } = require('../mcpManager');

const BUILTIN_TOOLS = [calculator, weather, webSearch];

function getAllTools() {
  return [...BUILTIN_TOOLS, ...getMcpTools()];
}

async function executeTool(name, args) {
  const all = getAllTools();
  const tool = all.find(t => t.definition.name === name);
  if (!tool) return { error: `Unknown tool: ${name}` };
  try {
    return await tool.execute(args ?? {});
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { BUILTIN_TOOLS, getAllTools, executeTool };
