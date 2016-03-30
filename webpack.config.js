// var webpack = require('webpack')

module.exports = {
 module: {
   resolve: {
     extension: ["", ".js", ".json"],
   },
   loaders: [
       { test: /\.json$/, loader: 'json-loader' },
   ]
 }
}
