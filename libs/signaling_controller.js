const md5 = require('md5')
const EventEmitter = require("events").EventEmitter
const redis = require('redis')
const Rx = require('rx')

const _ = require('underscore')
const log4js = require('log4js')

const ssgStore = require('./redux-libs/store')
const Skyway = require('./Connector/Skyway')

const streaming_process = require('./miscs/streaming_process')
const sdp = require('./miscs/sdp')

const CONF = require('../conf/skyway.json')
const JANUS_CONF = require('../conf/janus.json')

const {
  RESPONSE_CREATE_ID,
  RESPONSE_ATTACH,
  RESPONSE_MEDIATYPE,
  RESPONSE_OFFER,
  LONGPOLLING_ATTACHED,
  LONGPOLLING_OFFER,
  LONGPOLLING_ANSWER,
  LONGPOLLING_KEEPALIVE,
  LONGPOLLING_WEBRTCUP,
  PLUGIN,
  requestCreateId,
  requestAttach,
  requestMediatype,
  requestOffer,
  requestAnswer,
  requestTrickle,
  requestStreamingList,
  requestStreamingWatch,
  requestStreamingStop,
  pushTrickle,
  setBufferCandidates,
  setHandleId,
  setPairOfPeerids
} = require('./redux-libs/actions')

const util = require('./miscs/util')
const logger = log4js.getLogger('signaling_controller')


class SignalingController extends EventEmitter {
  /**
   * constructor:
   * initialize skyway and ssgStore, then setup handlers
   *
   */
  constructor() {
    super();

    this.apikey = CONF['apikey'] || 'invalidkey'
    this.options   = {
      origin: CONF['origin'] || null,
      secure: CONF['secure'] || true
    };

    this.ssgStore = ssgStore // store for Janus
  }

  /**
   * start connecting skyway server, then setHandler
   *
   */
  start() {
    this.sub = redis.createClient()
    this.pub = redis.createClient()
    this.sub.subscribe(util.TOPICS.CONTROLLER_SIGNALING.key)

    this.sub.on('subscribe', (channel) => {
      logger.info(`topic ${channel} subscribed`)
      this.setSubscriberHandler()
    })
    this.skyway = new Skyway(this.apikey, this.options, this)

    this.skyway.on("opened", peerid => {
      const notify = {
        type: "notify",
        target: "profile",
        method: "skyway_opened",
        body: {
          "ssg_peerid": peerid
        }
      }
      this.pub.publish(util.TOPICS.MANAGER_PROFILE.key, JSON.stringify(notify))

      this.setSkywayHandler()
      this.setJanusHandler()
    })
  }

  /**
   * set skyway handlers
   *
   */
  setSkywayHandler() {
    this.skyway.on("receive/offer", (connection_id, offer, p2p_type) => {
      // we'll change sdp message to force opus codec when it is indicated.
      if(process.env.FORCE_OPUS==='true') {
        const forced_sdp = sdp.force_opus(offer.sdp)

        offer = Object.assign({}, offer, {sdp: forced_sdp})
      }

      this.ssgStore.dispatch(requestCreateId(connection_id, {
        offer,
        p2p_type,
        plugin: "skywayiot",
        shouldBufferCandidates: true
      }))
    })

    this.skyway.on("receive/answer", (connection_id, answer, p2p_type) => {
      this.ssgStore.dispatch(requestAnswer(connection_id, {
        answer,
        p2p_type,
        shouldBufferCandidates: false
      }))
    })

    this.skyway.on("receive/candidate", (connection_id, candidate) => {
      // before receiveing LONGPOLLING_ANSWER, We buffer candidate
      let { connections } = this.ssgStore.getState().sessions

      // In mobile devices (iOS and Android), sdk sends ice trickle message before offer will be sent.
      // In this case, candidates should be buffered but it will not since connection[connection_id] will be undefined.
      // To prevent this, we will dispatch setBufferCandidates() to be buffered for ice candidates before offer will be received.
      let connection = null, shouldBuffer = null;

      if( _.has(connections, connection_id) ) {
        connection = connections[connection_id]
        shouldBuffer = connection.shouldBufferCandidates
      } else {
        // In case when candidates will be received before Offer will arrive
        shouldBuffer = true
        this.ssgStore.dispatch(setBufferCandidates(connection_id, shouldBuffer))
      }

      // When shouldBufferCandidates is true, we'll push candidate object into dedicated buffer.
      // When it is not, we'll send trickle request to Janus Gateway
      if( shouldBuffer ) {
        this.ssgStore.dispatch(pushTrickle(connection_id, candidate))
      } else {
        this.ssgStore.dispatch(requestTrickle(connection_id, candidate))
      }
    })

    Rx.Observable.fromEvent(this.skyway, "message")
      .filter(mesg => mesg.type === "response" && mesg.target === "room")
      .subscribe(mesg => { this.pub.publish(util.TOPICS.CONTROLLER_DATACHANNEL.key, JSON.stringify(mesg)) })
  }

  /**
   * set janus handlers
   *
   */
  setJanusHandler() {
    this.ssgStore.subscribe(() => {
      // obtain current session state
      let { connections, lastUpdatedConnection, lastAction } = this.ssgStore.getState().sessions;
      let connection_id = lastUpdatedConnection

      // print log and emit event for this state
      logger.info(`${lastAction}   [${lastUpdatedConnection}]`)
      this.emit('connections/updated', connections, lastUpdatedConnection)

      // check connection_id availability, when deleted do nothing.
      if( !connection_id ) {
        logger.warn(`can not find connection_id`);
        return;
      }

      if( !_.has(connections, connection_id) ) {
        // In this case, do checking stream sessions availability.
        // When there is no, we'll kill streaming process.

        streaming_process.stop_if_no_streaming(connections)

        logger.info(`connection ${connection_id} already deleted`);
        return;
      }

      // do procedure, depends on action type
      let connection = connections[connection_id]
      let is_media = connection.p2p_type === "media"

      switch(connection.status) {
        case RESPONSE_CREATE_ID:
          this.ssgStore.dispatch(requestAttach(connection_id, `janus.plugin.${connection.plugin}`))
          break;
        case RESPONSE_ATTACH:
          if(connection.plugin === "streaming") {
            this.ssgStore.dispatch(requestStreamingList(connection_id))
          } else {
            this.ssgStore.dispatch(requestMediatype(connection_id, {video: is_media, audio: is_media}))
          }
          break;
        case PLUGIN.STREAMING.RESPONSE_LIST:
          this.ssgStore.dispatch(requestStreamingWatch(connection_id, 1))
          break;
        case LONGPOLLING_ATTACHED:
          this.ssgStore.dispatch(requestOffer(connection_id, {video: is_media, audio: is_media}, connection.offer))
          break;
        case LONGPOLLING_OFFER:
          this.skyway.sendOffer(connection_id, connection.offer, "media")
          break;
        case LONGPOLLING_ANSWER:
          this.skyway.sendAnswer(connection_id, connection.answer, connection.p2p_type)

          // lift restriction to buffer candidates
          this.ssgStore.dispatch(setBufferCandidates(connection_id, false))

          // dispatch each buffered candidates, when it exists
          if(connection.buffCandidates instanceof Array && connection.buffCandidates.length > 0) {
            connection.buffCandidates.forEach( candidate =>
              this.ssgStore.dispatch(requestTrickle(connection_id, candidate))
            )
          } else {
            logger.info("no buffered candidates found");
          }

          break;
        case LONGPOLLING_WEBRTCUP:
          // execute media streaming process when it is not work yet.
          streaming_process.attempt_to_start(connections)
          break;
        default:
          break;
      }
    })
  }

  /**
   * set redis subscriber handler
   */
  setSubscriberHandler() {
    this.sub.on('message', (channel, data) => {
      logger.debug("message from redis", channel, data)
      try {
        const _data = JSON.parse(data).payload
        if(_data.type !== 'request') return;
        switch(_data.target) {
        case 'stream':
          this.handleStreaming(_data)
          break;
        case 'room':
          this.handleRoom(_data)
          break;
        default:
          break;
        }
      } catch(e) {
        logger.warn(e)
      }
    })
  }

  /**
   * handle streaming request
   *
   * @param {object} data
   * @param {string} data.type - "request"
   * @param {string} data.target - "stream"
   * @param {string} data.method - "start" or "stop"
   * @param {object} data.body
   * @param {string} data.body.handle_id
   * @param {string} [data.body.src] - source peer id (available when method is start)
   */
  handleStreaming(data) {
    switch(data.method) {
    case 'start':
      this.startStreaming(data.body.handle_id, data.body.src)
      break;
    case 'stop':
      this.stopStreaming(data.body.handle_id);
      break;
    default:
      break;
    }
  }

  /**
   * start streaming plugin
   *
   * @param {string} handle_id - handle id (identifier for data channel)
   * @param {string} src - peerid of client
   */
  startStreaming(handle_id, src) {
    if(this.skyway.status !== "opened" ) {
      logger.error( "skyway is not opened" );
      return;
    }

    const connection_id = util.createConnectionId("media")

    // since, using streaming plugin does not initiate peer from browser,
    // so we will use connection object in SkyWay connector, explicitly
    let client_peer_id = src
    let ssg_peer_id = this.skyway.myPeerid

    this.ssgStore.dispatch(setPairOfPeerids(connection_id, client_peer_id, ssg_peer_id));

    this.ssgStore.dispatch(setHandleId(connection_id, handle_id.toString('hex')));
    this.ssgStore.dispatch(requestCreateId(connection_id, {
      offer: null,
      p2p_type: "media",
      plugin: "streaming",
      shouldBufferCandidates: false
    }))
  }

  /**
   * stop streaming plugin
   *
   * @param {string} handle_id - handle id (identifier for data channel)
   *
   */
  stopStreaming(handle_id) {
    if(this.skyway.status !== 'opened') {
      logger.error( "skyway is not opened" )
      return;
    }
    let connection_id = this.getConnectionId(handle_id.toString('hex'))

    if(connection_id !== "") this.ssgStore.dispatch(requestStreamingStop(connection_id))
  }

  /**
   * handle room api
   *
   * @param {object} data
   * @param {string} data.type - "request"
   * @param {string} data.target - "room"
   * @param {string} data.method - "join" or "leave"
   * @param {object} data.body
   * @param {string} data.body.roomName
   */
  handleRoom(data) {
    switch(data.method) {
    case 'join':
      this.sendRoomJoin(data.body.roomName)
      break;
    case 'leave':
      this.sendRoomLeave(data.body.roomName)
      break;
    default:
      break;
    }
  }


  /**
   * sendRoomJoin
   *
   * @param {string} name - room name
   */
  sendRoomJoin(name) {
    this.skyway.sendRoomJoin(name)
  }

  /**
   * sendRoomLeave
   *
   * @param {string} name - room name
   */
  sendRoomLeave(name) {
    this.skyway.sendRoomLeave(name)
  }


  /**
   * get connection id from handle_id
   *
   * @param {string} handle_id - handle id (identifier for data channel)
   */
  getConnectionId(handle_id) {
    let { connections } = this.ssgStore.getState().sessions

    // search connection_id for handle_id. then return
    for( let connection_id in connections ) {
      let connection = connections[connection_id];
      if(connection.handle_id === handle_id) return connection_id
    }

    // when connection_id is not found, we'll return ""
    return ""
  }

  /**
   * get client peer id. it will be retrieved from ssg store
   *
   * @param {string} connection_id - connection id
   * @private
   */
  getClientPeerid(connection_id){
    let {connections} = this.ssgStore.getState().sessions

    return connections[connection_id].peerids.client
  }

  /**
   * get SSG peer id. it will be retrieved from ssg store
   *
   * @param {string} connection_id - connection id
   * @private
   */
  getSSGPeerid(connection_id){
    // fixme
    let {connections} = this.ssgStore.getState().sessions

    return connections[connection_id].peerids.ssg
  }

  /**
   * set pair of peerids for ssg store
   *
   * @params {string} connection_id
   * @params {string} src
   * @params {string} dst
   */
  setPairOfPeerids(connection_id, src, dst) {
    this.ssgStore.dispatch(setPairOfPeerids(connection_id, src, dst));
  }
}


module.exports = new SignalingController()
