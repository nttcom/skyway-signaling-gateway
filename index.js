// index.js

var Gateway = require('./libs/Gateway.js');

var skyway_gateway = new Gateway('skyway')
  , janus_gateway = new Gateway('janus')


skyway_gateway.start();  // todo : server_name should be obtained from command-line argument
janus_gateway.start();  // todo : server_name should be obtained from command-line argument

// gateway.stop();
