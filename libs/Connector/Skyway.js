"use strict";

const EventEmitter = require("events").EventEmitter
const log4js = require('log4js')
const Socket = require('./socket')
const path = require('path')

const { setPairOfPeerids } = require('../redux-libs/actions')
const logger = log4js.getLogger('SkyWayConnector');

const util = require("../miscs/util")
const yaml = require('node-yaml')
const CONF = yaml.readSync( path.join( process.env.HOME, '/.ssg/skyway.yaml') )


class SkywayConnector extends EventEmitter {
  /**
   * constructor
   *
   * @param {string} key     - API KEY
   * @param {object} options - options for Socket constructor
   * @param {object} controller - Singnaling Controller
   *
   */
  constructor(key, options, controller){
    super();
    // configure static parameter
    this.apikey    = key

    // configure random parameters
    this.myPeerid = process.env.PEERID || CONF['peerid'] || util.randomIdForSkyway();
		this.myPeerid = `SSG_${this.myPeerid}`;
    this.token    = util.randomTokenForSkyway();
    this.brPeerid = null;
    this.options  = options;

    this.controller = controller;

    this._changeStatus("init")
  }

  /**
   * start connection to SkyWay signalling server
   */
  connect(){
    this.socket = new Socket(this.apikey, this.options);

    logger.info(`start establishing connection to server (${this.myPeerid})`);

    this._changeStatus("opening")

    return new Promise((resolv, reject) => {
      this.socket.start(this.myPeerid, this.token)
        .then(() => {
          // when connection established to SkyWay server,
          // we'll set EventHandler for SkyWay message
          this.socket.on(util.MESSAGE_TYPES.SERVER.OPEN.key, () => {
            logger.info("connection established");

            this._changeStatus("opened", this.myPeerid)
            this._setSocketHandler();

            resolv()
          });

          this.socket.on(util.MESSAGE_TYPES.SERVER.ERROR.key, err => reject(err))
        }).catch(err => reject(err))
    })
  }



  /**
   * send offer message to skyway signaling server
   *
   * @param {string} connection_id - connection id
   * @param {object} jsep - jsep object for OFFER
   * @param {string} type - type of stream. "media" or "data"
   * @param {string} [roomName]    - name of room
   *
   */
  sendOffer(connection_id, jsep, type="media", roomName=null) {
    // fixme - type should be determined by parsing jsep.sdp
    const data = {
      offer: jsep,
      src: this.myPeerid,
      dst: this.controller.getClientPeerid(connection_id),
      connectionId: connection_id,
      connectionType: type,
      roomName: roomName
    }
    this._send(util.MESSAGE_TYPES.CLIENT.SEND_OFFER.key, data)
  }

  /**
   * send answer message to skyway signaling server
   *
   * @param {string} connection_id - connection id
   * @param {object} jsep - jsep object of ANSWER message
   * @param {string} type - stream type. "media" or "data"
   * @param {string} [roomName]    - name of room
   */
  sendAnswer(connection_id, jsep, type="media", roomName=null) {
    const data = {
      answer: jsep,
      src: this.myPeerid,
      dst: this.controller.getClientPeerid(connection_id),
      connectionId: connection_id,
      connectionType: type,
      roomName: roomName
    }
    this._send(util.MESSAGE_TYPES.CLIENT.SEND_ANSWER.key, data)
  }

  /**
   * send ROOM_JOIN message to skyway signaling server
   *
   * @param {string} roomName - name of room
   * @praam {string} roomType - 'mesh' or 'sfu' (default is mesh)
   */
  sendRoomJoin(roomName, roomType='mesh') {
    const data = {
      roomName,
      roomType
    }
    this._send(util.MESSAGE_TYPES.CLIENT.ROOM_JOIN.key, data)
  }

  /**
   * send ROOM_GET_USERS message to skyway signaling server
   *
   * @param {string} roomName - name of room
   * @praam {string} roomType - 'mesh' or 'sfu' (default is mesh)
   */
  sendGetUsers(roomName, roomType='mesh') {
    const data = {
      roomName,
      roomType
    }
    this._send(util.MESSAGE_TYPES.CLIENT.ROOM_GET_USERS.key, data)
  }

  /**
   * send ROOM_LEAVE message to skyway signaling server
   *
   * @param {string} roomName - name of room
   */
  sendRoomLeave(roomName) {
    const data = {
      roomName
    }
    this._send(util.MESSAGE_TYPES.CLIENT.ROOM_LEAVE.key, data)
  }

  /////////////////////////////////////////////////////////
  // private
  /////////////////////////////////////////////////////////

  /**
   * send message to SkyWay signaling server
   *
   * @param {string} type - message type
   * @param {object} data - data to send
   * @private
   */
  _send(type, data) {
    // send message to Skyway server
    try {
      this.socket.send(type, data);
    } catch(err) {
      logger.error(err.toString());
    }
  }


  /**
   * set websocket handler for skyway signaling server
   *
   * @private
   */
  _setSocketHandler(){
    util.MESSAGE_TYPES.SERVER.enums.forEach( type => {
      this.socket.on(type.key, data => {
        this._setMessageHandlerFromServer(type.key, data);
      })
    });
  }


  /**
   * handle signaling message from skyway signaling server
   *
   * @param {string} type - message type (OPEN, OFFER, ANSWER, CANDIDATE, ROOM_USER_JOIN, ROOM_USER_LEAVE )
   * @param {object} mesg - signaling message object
   * @private
   */
  _setMessageHandlerFromServer(type, mesg) {
    if(typeof(mesg) !== 'object') return;

    const connection_id = mesg.connectionId
    const src = mesg.src
    const dst = mesg.dst
    const p2p_type = mesg.connectionType  // 'media' or 'data'

    logger.debug(`messageHandlerFromServer ${type}`)

    switch(type) {
      case util.MESSAGE_TYPES.SERVER.OPEN.key:
        // connection to skyway established. this doesn't mean that peer opened
        this.emit(type, mesg)
        break;
      case util.MESSAGE_TYPES.SERVER.OFFER.key:
        // receive OFFER from skyway
        this.emit(type, mesg)
        let offer = mesg.offer

        if(!connection_id || !src || !dst || !offer || !p2p_type) return;

        // fixme
        this.controller.setPairOfPeerids(connection_id, src, dst);
        this.emit('receive/offer', connection_id, offer, p2p_type)
        break;
      case util.MESSAGE_TYPES.SERVER.ANSWER.key:
        // receive ANSWER from skyway
        this.emit(type, mesg)
        let answer = mesg.answer

        if(!connection_id || !src || !dst || !answer || !p2p_type) return;

        // fixme
        this.controller.setPairOfPeerids(connection_id, src, dst);

        this.emit('receive/answer', connection_id, answer, p2p_type)
        break;
      case util.MESSAGE_TYPES.SERVER.CANDIDATE.key:
        // receive ANSWER from skyway
        this.emit(type, mesg)
        let candidate = mesg.candidate

        if(!connection_id || !src || !dst || !candidate) return;

        this.emit('receive/candidate', connection_id, candidate)
        break;
      case util.MESSAGE_TYPES.SERVER.ROOM_USER_JOIN.key:
      case util.MESSAGE_TYPES.SERVER.ROOM_USERS.key:
      case util.MESSAGE_TYPES.SERVER.ROOM_USER_LEAVE.key:
        var data = {
          type: "response",
          target: "room",
          method: type.toLowerCase(),
          body: Object.assign({}, mesg, {ssg_peerid: this.myPeerid})
        }
        this.emit('message', data);
        break;
      case util.MESSAGE_TYPES.SERVER.CLOSE.key:
        this._changeStatus("closed")
        logger.info("closed connection with SkyWay")
        break;
      case util.MESSAGE_TYPES.SERVER.ERROR.key:
        this._changeStatus("server_error")
        logger.warn("server error")
        break;
      default:
        logger.warn(`unknown message [${mesg.type}]`)
        break;
    }
  }



  /**
   *
   * change status of SkyWay connector. Also emit event
   *
   * @param {string} status - status of this connector
   * @private
   */
  _changeStatus(status, argument) {
    this.status = status;
    this.emit(status, argument)
  }
}


module.exports = SkywayConnector;
