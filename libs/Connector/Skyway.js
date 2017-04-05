"use strict";

const EventEmitter = require("events").EventEmitter
const log4js = require('log4js')
const Socket = require('./socket')

const { setPairOfPeerids } = require('../redux-libs/actions')
const logger = log4js.getLogger('SkyWayConnector');

const util = require("../miscs/util")
const CONF = require('../../conf/skyway.json')


class SkywayConnector extends EventEmitter {
  /**
   * constructor
   *
   * @param {string} key     - API KEY
   * @param {object} options - options for Socket constructor
   * @param {object} store   - SSG store
   *
   */
  constructor(key, options, store){
    super();
    // configure static parameter
    this.apikey    = key

    // configure random parameters
    this.myPeerid    = process.env.PEERID || CONF['peerid'] || "SSG_"+util.randomIdForSkyway();
    this.token   = util.randomTokenForSkyway();
    this.brPeerid = null;
    this.options = options;

    this.store = store;

    this._changeStatus("init")
    this.connect();
  }

  /**
   * start connection to SkyWay signalling server
   */
  connect(){
    this.socket = new Socket(this.apikey, this.options);

    logger.info(`start establishing connection to server (${this.myPeerid})`);

    this._changeStatus("opening")

    // when connection established to SkyWay server,
    // we'll set EventHandler for SkyWay message
    this.socket.on(util.MESSAGE_TYPES.SERVER.OPEN.key, () => {
      logger.info("connection established");

      this._changeStatus("opened")
      this._setSocketHandler();
    });

    this.socket.start(this.myPeerid, this.token)
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
      dst: this._getClientPeerid(connection_id),
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
      dst: this._getClientPeerid(connection_id),
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

        this.store.dispatch(setPairOfPeerids(connection_id, src, dst))
        this.emit('receive/offer', connection_id, offer, p2p_type)
        break;
      case util.MESSAGE_TYPES.SERVER.ANSWER.key:
        // receive ANSWER from skyway
        this.emit(type, mesg)
        let answer = mesg.answer

        if(!connection_id || !src || !dst || !answer || !p2p_type) return;

        this.store.dispatch(setPairOfPeerids(connection_id, src, dst))
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
        this.emit('receive/room_user_join', data);
        break;
      case util.MESSAGE_TYPES.SERVER.ROOM_USERS.key:
        this.emit('receive/room_users', data);
        break;
      case util.MESSAGE_TYPES.SERVER.ROOM_USER_LEAVE.key:
        this.emit('receive/room_user_leave', data);
        break;
      case util.MESSAGE_TYPES.SERVER.CLOSE.key:
        this._changeStatus("closed")
        logger.info("closed connection with SkyWay")
        break;
      case util.MESSAGE_TYPES.SERVER.ERROR.key:
        this._changeStatus("error")
        logger.warn(data)
        break;
      default:
        logger.warn(`unknown message [${mesg.type}]`)
        break;
    }
  }

  /**
   * get client peer id. it will be retrieved from ssg store
   *
   * @param {string} connection_id - connection id
   * @private
   */
  _getClientPeerid(connection_id){
    let {connections} = this.store.getState().sessions

    return connections[connection_id].peerids.client
  }

  /**
   * get SSG peer id. it will be retrieved from ssg store
   *
   * @param {string} connection_id - connection id
   * @private
   */
  _getSSGPeerid(connection_id){
    let {connections} = this.store.getState().sessions

    return connections[connection_id].peerids.ssg
  }



  /**
   *
   * change status of SkyWay connector. Also emit event
   *
   * @param {string} status - status of this connector
   * @private
   */
  _changeStatus(status) {
    this.status = status;
    this.emit(status)
  }
}


module.exports = SkywayConnector;
