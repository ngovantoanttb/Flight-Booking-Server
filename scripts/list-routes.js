// scripts/list-routes.js
// Run: node scripts/list-routes.js

const app = require('../src/server');

function printRoutes(stack, basePath = '') {
  stack.forEach(layer => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      console.log(`${methods} ${basePath}${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      const newBase = basePath + (layer.regexp && layer.regexp.source !== '^\\/?$' ? extractBase(layer.regexp) : '');
      printRoutes(layer.handle.stack, newBase);
    }
  });
}

function extractBase(regexp) {
  // crude extraction of base path from regexp like '^\\/api\\/?(?=\\/|$)'
  try {
    const src = regexp.source;
    const m = src.match(/\\/([a-zA-Z0-9_-]+)(?:\\\\\/|\\\\\/?|$)/);
    if (!m) return '';
    return '/' + m[1];
  } catch (e) {
    return '';
  }
}

const stack = app._router.stack;
printRoutes(stack);