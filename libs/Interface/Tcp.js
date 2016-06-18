// Tcp.js
"use strict";

var EventEmitter = require('events').EventEmitter
  , log4js = require("log4js")
  , net = require('net')

var logger = log4js.getLogger("Interface/Tcp")


class Tcp extends EventEmitter {
  constructor(manager, port) {
    super();

    // todo : validate argument

    this.manager = manager;
    this.server = net.createServer();
    this.listenPort = port;
    this.startListen();
  }

  startListen() {
    this.server.on('connection', this.handleConnection.bind(this) );

    this.manager.on("jConnector/message", (mesg) => {
      logger.debug("handle message from jConnector/message %s", mesg);
    });

    this.server.listen(this.listenPort, () => {
      logger.info('tcp server listening to %j : %d', this.server.address(), this.listenPort);
    });
  }

  handleConnection(conn) {
    let remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
    logger.info('new client connection from %s', remoteAddress);

    conn.on('data', onConnData.bind(this));
    conn.once('close', onConnClose.bind(this));
    conn.on('error', onConnError.bind(this));

    this.manager.on("jConnector/message", relay);

    function onConnData(data) {
      this.manager.send_jConnector(data);
    }

    function onConnClose() {
      logger.info('connection from %s closed', remoteAddress);
      this.manager.removeListener("jConnector/message", relay);
    }

    function onConnError(err) {
      logger.warn('Connection %s error: %s', remoteAddress, err.message);
      this.manager.removeListener("jConnector/message", relay);
    }

    function relay(mesg) {
      logger.debug('message received from jConnector/message : %s', remoteAddress);

      conn.write(mesg);
    }
  }
}

module.exports = Tcp;
