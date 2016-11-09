"use strict";

const WebSocket = require("ws")
const EventEmitter = require("events").EventEmitter

const util = require("../miscs/util")

const CONF = require('../../conf/skyway.json');

class SkywayConnector extends EventEmitter {
  constructor(params){
    super();
    // configure static parameter
    this.scheme     = CONF.scheme     || "wss://";
    this.serverAddr = CONF.serverAddr || "skyway.io";
    this.serverPort = CONF.serverPort || 443;
    this.path       = CONF.path       || "/";
    this.apikey    =  params.option && params.option.api_key  || CONF.apikey;
    this.origin     = params.option && params.option.origin   || CONF.origin;

    // configure random parameters
    this.myPeerid    = params.option && params.option.peerid  || "SSG_"+util.randomIdForSkyway();
    this.token   = util.randomTokenForSkyway();
    this.brPeerid = null;

    this.connections = {};

    // setup url for SkyWay server
    this.serverUrl = [
      this.scheme,
      this.serverAddr,
      ":",
      this.serverPort,
      this.path,
      "peerjs?key=" + this.apikey,
      "&id=" + this.myPeerid,
      "&token=" + this.token
    ].join("");

    this.status = "init"
    this.connect();
  }

  /**
   * start connection to SkyWay signalling server
   */
  connect(){
    this.socket = new WebSocket(this.serverUrl, [] , {"origin": this.origin});

    console.info(`start establishing connection to server (${this.myPeerid})`);

    this.status = "opening"
    // connection established
    this.socket.addEventListener("open", () => {
      this.status = "opened"
      this.emit(this.status);
      console.info("connection established");
      this.setSocketHandler();
    });
  }

  setSocketHandler(){
    // unfortunately, error happened
    this.socket.addEventListener("error", (err) => {
      this.emit("error", err);
      console.error(err);
    });

    // connection closed
    this.socket.addEventListener("close", () => {
      this.status = "closed"
      this.emit("close");
      console.info("connection closed");
    });

    // when message received, it will be handled in messageHandler.
    this.socket.addEventListener("message", (ev)  => {
      try {
        var mesg = JSON.parse(ev.data);
      } catch(err) {
        console.warn(err.toString());
      }
      this.messageHandlerFromServer(mesg);
    });
  }


  updatePeerConnection(connection_id, params) {
    this.connections[connection_id] = Object.assign({}, this.connections[connection_id], params);
  }

  sendOffer(connection_id, jsep, type="media") {
    // fixme - type should be determined by parsing jsep.sdp
    let json = {
      src: this.myPeerid,
      dst: this.connections[connection_id].src,
      payload: {
        sdp: jsep,
        type,
        connectionId: connection_id,
        browser: "Chrome"
      },
      type: "OFFER"
    }
    this.send(json)
  }

  sendAnswer(connection_id, jsep, type="media") {
    // fixme - type should be determined by parsing jsep.sdp
    let json = {
      src: this.myPeerid,
      dst: this.connections[connection_id].src,
      payload: {
        browser: "Chrome",
        connectionId: connection_id,
        sdp: jsep,
        type
      },
      type: "ANSWER"
    }
    this.send(json)
  }

  sendTricle() {

  }

  sendPong() {
    let json = {type: "PONG"}
    this.send(json)
  }

  send(json) {
    // send message to Skyway server
    try {
      let mesg = JSON.stringify(json);
      this.socket.send(mesg);
    } catch(err) {
      console.error(err);
    }
  }

  emitEvent(mesg) {
    this.emit('event', mesg.type, mesg)
  }

  messageHandlerFromServer(mesg) {
    let connection_id = mesg.payload && mesg.payload.connectionId
    let src = mesg.src
    let dst = mesg.dst

    switch(mesg.type) {
      case 'OPEN':
        // connection to skyway established. this doesn't mean that peer opened
        this.emitEvent(mesg)
        break;
      case 'PING':
        // receive keepalive message
        // simply send pong back
        this.sendPong()
        break;
      case 'OFFER':
        // receive OFFER from skyway
        this.emitEvent(mesg)
        let offer = mesg.payload.sdp
        var type = mesg.payload.type

        this.updatePeerConnection(connection_id, {src, dst, offer, type})
        this.emit('receive/offer', connection_id, offer, type)
        break;
      case 'ANSWER':
        // receive ANSWER from skyway
        this.emitEvent(mesg)
        let answer = mesg.payload.sdp
        var type = mesg.payload.type

        this.updatePeerConnection(connection_id, {src, dst, answer, type})
        this.emit('receive/answer', connection_id, answer, type)
        break;
      case 'CANDIDATE':
        // receive ANSWER from skyway
        this.emitEvent(mesg)
        let candidate = mesg.payload.candidate

        this.updatePeerConnection(connection_id, {src, dst, candidate})
        this.emit('receive/candidate', connection_id, candidate)
        break;
      default:
        console.warn(`unknown message [${mesg.type}]`)
        break;
    }
  }
}

module.exports = SkywayConnector;
