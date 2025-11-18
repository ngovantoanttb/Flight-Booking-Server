// Simple route lister - prints methods and paths for mounted routes
// Usage: node scripts/list-routes-simple.js

const app = require('../src/server');

function listStack(stack, prefix = '') {
  stack.forEach(layer => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
      console.log(`${methods} ${prefix}${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      // Print mount regexp for context (can't easily extract exact base path reliably)
      const mount = layer.regexp && layer.regexp.fast_slash ? '' : (layer.regexp ? layer.regexp.toString() : '');
      const newPrefix = prefix + (mount ? `(${mount})` : '');
      listStack(layer.handle.stack, newPrefix);
    }
  });
}

if (!app || !app._router) {
  console.error('App or router not found. Make sure server exports the express app.');
  process.exit(1);
}

console.log('Listing routes (methods PATH). Note: router mount points shown as regex where applicable.');
listStack(app._router.stack);
