const md5 = require('md5')
const EventEmitter = require("events").EventEmitter

const _ = require('underscore')
const log4js = require('log4js')

const CONF = require('../conf/skyway.json')

const {
  RESPONSE_CREATE_ID,
  RESPONSE_ATTACH,
  RESPONSE_MEDIATYPE,
  RESPONSE_OFFER,
  LONGPOLLING_ATTACHED,
  LONGPOLLING_OFFER,
  LONGPOLLING_ANSWER,
  LONGPOLLING_KEEPALIVE,
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
  constructor(ssgStore, Skyway) {
    super(ssgStore, Skyway);

    this.my_peerid = process.env.PEERID || CONF['peerid'] || null

    this.ssgStore = ssgStore // store for Janus
    this.skyway = new Skyway({option:{peerid: this.my_peerid}}, ssgStore)

    this.skyway.on("opened", ev => {
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
      logger.debug(candidate)

      // When shouldBufferCandidates is true, we'll push candidate object into dedicated buffer.
      // When it is not, we'll send trickle request to Janus Gateway
      if( shouldBuffer ) {
        this.ssgStore.dispatch(pushTrickle(connection_id, candidate))
      } else {
        this.ssgStore.dispatch(requestTrickle(connection_id, candidate))
      }
    })
  }

  /**
   * set janus handlers
   * 
   */
  setJanusHandler() {
    this.ssgStore.subscribe(() => {
      // obtain current session state
      let { connections, lastUpdatedConnection } = this.ssgStore.getState().sessions;
      let connection_id = lastUpdatedConnection

      if(!!lastUpdatedConnection === false) return;
      if(!!connections[lastUpdatedConnection] === false) return;

      this.emit('connections/updated', connections, lastUpdatedConnection)

      let connection = connections[connection_id]

      logger.info(`${connection.status}   [${connection_id}]`)

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

          // dispatch each buffered candidates
          connection.buffCandidates.forEach( candidate =>
            this.ssgStore.dispatch(requestTrickle(connection_id, candidate))
          )
          break;
        default:
          break;
      }
    })
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
    let ssg_peer_id = this.my_peerid
    
    this.ssgStore.dispatch(setPairOfPeerids(connection_id, client_peer_id, ssg_peer_id));

    this.ssgStore.dispatch(setHandleId(connection_id, handle_id));
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
    let connection_id = this.getConnectionId(handle_id)

    if(connection_id !== "") this.ssgStore.dispatch(requestStreamingStop(connection_id))
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
}


module.exports = SignalingController
