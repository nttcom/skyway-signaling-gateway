"use strict";

// const WebSocket = require("ws")
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
  }

  /**
   * start connection to SkyWay signalling server
   */
  connect(callback){
    this.socket = new WebSocket(this.serverUrl, [] , {"origin": this.origin});

    console.info("start establishing connection to server");

    this.setSocketHandler();
  }

  sendOffer() {

  }

  sendAnswer(id, jsep, type="media") {
    let json = {
      src: this.myPeerid,
      dst: this.connections[id].src,
      payload: {
        browser: "Chrome",
        connectionId: id,
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

  setSocketHandler(){
    // connection established
    this.socket.addEventListener("open", () => {
      this.emit("socket/open");
      console.info("connection established");
    });

    // unfortunately, error happened
    this.socket.addEventListener("error", (err) => {
      this.emit("socket/error", err);
      console.error(err);
    });

    // connection closed
    this.socket.addEventListener("close", () => {
      this.emit("socket/close");
      console.info("connection closed");
    });

    // when message received, it will be handled in messageHandler.
    this.socket.addEventListener("message", (ev)  => {
      try {
        let mesg = JSON.parse(ev.data);
        this.messageHandlerFromServer(mesg);
      } catch(err) {
        console.warn(err.toString());
      }
    });
  }

  emitEvent(mesg) {
    this.emit('event', mesg.type, mesg)
  }

  messageHandlerFromServer(mesg) {
    try {
      console.log(`receive from SkyWay ${mesg.type}`);
      console.log(mesg);
      let id = mesg.payload && mesg.payload.connectionId
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
          this.connections[id] = Object.assign({}, this.connections[id], {
            src, dst, offer
          });
          this.emit('receive/offer', id, offer)
          break;
        case 'ANSWER':
          // receive ANSWER from skyway
          this.emitEvent(mesg)
          let answer = mesg.payload.sdp
          this.connections[id] = Object.assign({}, this.connections[id], {
            [id]: {src, dst, answer}
          });
          this.emit('receive/answer', id, answer)
          break;
        case 'CANDIDATE':
          // receive ANSWER from skyway
          this.emitEvent(mesg)
          let candidate = mesg.payload.candidate
          this.connections[id] = Object.assign({}, this.connections[id], {
            [id]: {src, dst, candidate}
          });
          this.emit('receive/candidate', id, candidate)
          break;
        default:
          console.warn(`unknown message [${mesg.type}]`)
          break;
      }
    } catch(err) {
      console.error(err);
    }
  }
}

module.exports = SkywayConnector;
