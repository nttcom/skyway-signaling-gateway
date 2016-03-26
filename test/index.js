// This will search for files ending in .test.js and require them
// // so that they are added to the webpack bundle
var webpackConfig = require('../webpack.config')
  , loader = require('json-loader')

var enhancedRequire = require('enhanced-require')(module, {
  recursive: true,
  resolve: webpackConfig.resolve,
  loaders: webpackConfig.loaders
});


var context = enhancedRequire.context('.', true, /\/unit\/.+\.test\.js?$/);
context.keys().forEach(context);

module.exports = context;
