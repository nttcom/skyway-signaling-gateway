var webpack = require('webpack')

var path = require('path')
, _entry = {}
, _devtool = ""
, _output = {}
, _port = 8080

// change configuration by NODE_ENV
switch(process.env.NODE_ENV) {
case "browsertest":
default:
  _entry = {
    "browsertest" : "mocha!./test/integration/ssg.test.js"
  };
  _devtool: "source-map";
  _output = {
    path: path.join(__dirname, "test"),
    publicPath: "",
    filename: "[name].build.js"
  };
  _port = 8080;
  break;
}


module.exports = {
  entry: _entry,
  devtool: _devtool,
  output: _output,
  module: {
    loaders: [
    {
      test: /\.(js|jsx)?$/,
      exclude: /(node_modules)/,
      loader: 'babel', // 'babel-loader' is also a legal name to reference
      query: {
        presets: ['react', 'es2015']
      }
    },
      { test: /\.html$/, loader: 'raw-loader' }
    ]
  },
  devServer:{
    port: _port
  }
}
