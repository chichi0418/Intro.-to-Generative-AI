const { evaluate } = require('mathjs');

module.exports = {
  definition: {
    name: 'calculator',
    description: 'Evaluate a mathematical expression safely. Supports arithmetic, algebra, trig, and more.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The math expression to evaluate, e.g. "123 * 456", "sqrt(144)", "sin(pi/2)"',
        },
      },
      required: ['expression'],
    },
  },
  execute: async ({ expression }) => {
    try {
      const result = evaluate(expression);
      return { expression, result: String(result) };
    } catch (err) {
      return { expression, error: err.message };
    }
  },
};
