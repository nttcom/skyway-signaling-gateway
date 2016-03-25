// This will search for files ending in .test.js and require them
// // so that they are added to the webpack bundle
require = require('enhanced-require')(module, {recursive: true});


var context = require.context('.', true, /\/unit\/.+\.test\.js?$/);
context.keys().forEach(context);

module.exports = context;
