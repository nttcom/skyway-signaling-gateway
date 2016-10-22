var webpack = require('webpack');

var path = require('path')
  , _entry;

switch(process.env.NODE_ENV) {
  default:
    _entry = {
      "app": "./libs/entry.js"
    };
    break;
}

module.exports = {
  entry: _entry,
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "public/js"),
    publicPath: '/js/',
    filename: process.env.NODE_ENV === "production" ? "[name].build.min.js" : "[name].build.js"
  },
  module: {
    preLoaders: [
      { test: /\.json$/, exclude: /node_modules/, loader: 'json'  }
    ],
    loaders: [
      {
        test: /\.(js|jsx)?$/,
        exclude: /(node_modules)/,
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['react', 'es2015']
        }
      },
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins: [
  ]
}
