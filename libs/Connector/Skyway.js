"use strict";

const WebSocket = require("ws")
const EventEmitter = require("events").EventEmitter

const { setPairOfPeerids } = require('../redux-libs/actions')

const util = require("../miscs/util")

const CONF = require('../../conf/skyway.json');

class SkywayConnector extends EventEmitter {
  /**
   * constructor
   * 
   * @param {object} paramter
   * @param {string} apikey of skyway - apikey (required)
   * @param {string} origin - dummy origin for SSG e.g. 'http://localhost' (required)
   * @param {string} peerid - peerid of ssg (optional)
   * @param {object} store - SSG store
   * 
   */
  constructor(params, store){
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

    this.store = store;

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
  
  /**
   * get client peer id. it will be retrieved from ssg store
   * 
   * @param {string} connection_id - connection id
   */
  getClientPeerid(connection_id){
    let {connections} = this.store.getState().sessions

    return connections[connection_id].peerids.client
  }
  
  /**
   * get SSG peer id. it will be retrieved from ssg store
   * 
   * @param {string} connection_id - connection id
   */
  getSSGPeerid(connection_id){
    let {connections} = this.store.getState().sessions

    return connections[connection_id].peerids.ssg
  }


  /**
   * set websocket handler for skyway signaling server
   * 
   */
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

  /**
   * send offer message to skyway signaling server
   * 
   * @param {string} connection_id - connection id
   * @param {object} jsep - jsep object for OFFER
   * @param {string} type - type of stream. "media" or "data"
   * 
   */
  sendOffer(connection_id, jsep, type="media") {
    // fixme - type should be determined by parsing jsep.sdp
    let json = {
      src: this.myPeerid,
      dst: this.getClientPeerid(connection_id),
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

  /**
   * send answer message to skyway signaling server
   * 
   * @param {string} connection_id - connection id
   * @param {object} jsep - jsep object of ANSWER message
   * @param {string} type - stream type. "media" or "data"
   */
  sendAnswer(connection_id, jsep, type="media") {
    // fixme - type should be determined by parsing jsep.sdp
    let json = {
      src: this.myPeerid,
      dst: this.getClientPeerid(connection_id),
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

  /**
   * send PONG message to skyway signaling server. It will be invoked when PING received.
   */
  sendPong() {
    let json = {type: "PONG"}
    this.send(json)
  }

  /**
   * send message to SkyWay signaling server
   * 
   * @param {object} json - arbitrary json message
   */
  send(json) {
    // send message to Skyway server
    try {
      let mesg = JSON.stringify(json);
      this.socket.send(mesg);
    } catch(err) {
      console.error(err);
    }
  }

  /**
   * emit message via EventEmitter
   *
   * @param {object} mesg - arbitrary message object, it must have mesg.type
   */
  emitEvent(mesg) {
    if( typeof(mesg) === 'object' && mesg.type ) this.emit('event', mesg.type, mesg)
  }

  /**
   * handle signaling message from skyway signaling server
   * 
   * @param {object} mesg - signaling message object
   */
  messageHandlerFromServer(mesg) {
    if(typeof(mesg) !== 'object') return;
    
    let connection_id = mesg.payload && mesg.payload.connectionId
    let src = mesg.src
    let dst = mesg.dst
    let mesg_type = mesg.type
    
    if(!connection_id || !src || !dst || !mesg_type ) return;

    switch(mesg_type) {
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

        this.store.dispatch(setPairOfPeerids(connection_id, src, dst))
        this.emit('receive/offer', connection_id, offer, type)
        break;
      case 'ANSWER':
        // receive ANSWER from skyway
        this.emitEvent(mesg)
        let answer = mesg.payload.sdp
        var type = mesg.payload.type

        this.store.dispatch(setPairOfPeerids(connection_id, src, dst))
        this.emit('receive/answer', connection_id, answer, type)
        break;
      case 'CANDIDATE':
        // receive ANSWER from skyway
        this.emitEvent(mesg)
        let candidate = mesg.payload.candidate

        this.emit('receive/candidate', connection_id, candidate)
        break;
      default:
        console.warn(`unknown message [${mesg.type}]`)
        break;
    }
  }
}

module.exports = SkywayConnector;
