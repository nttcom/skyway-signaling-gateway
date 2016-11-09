const md5 = require('md5')
const EventEmitter = require("events").EventEmitter
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
} = require('./redux-libs/actions')
const util = require('./miscs/util')

const logger = log4js.getLogger('signaling_controller')

class SignalingController extends EventEmitter {
  constructor(janusStore, Skyway) {
    super(janusStore, Skyway);

    this.my_peerid = process.env.PEERID || CONF['peerid'] || null

    this.streaming_connectionids = {}

    this.janusStore = janusStore // store for Janus
    this.skyway = new Skyway({option:{peerid: this.my_peerid}})

    this.skyway.on("opened", ev => {
      this.setSkywayHandler()
      this.setJanusHandler()
    })
  }

  setSkywayHandler() {
    this.skyway.on("receive/offer", (connection_id, offer, p2p_type) => {
      this.janusStore.dispatch(requestCreateId(connection_id, {
        offer,
        p2p_type,
        plugin: "skywayiot",
        shouldBufferCandidates: true
      }))
    })

    this.skyway.on("receive/answer", (connection_id, answer, p2p_type) => {
      this.janusStore.dispatch(requestAnswer(connection_id, {
        answer,
        p2p_type,
        shouldBufferCandidates: false
      }))
    })

    this.skyway.on("receive/candidate", (connection_id, candidate) => {
      // before LONGPOLLING_ANSWER received, We buffer candidate
      let { connections } = this.janusStore.getState().sessions
      let connection = connections[connection_id]


      if(connection.shouldBufferCandidates) {
        this.janusStore.dispatch(pushTrickle(connection_id, candidate))
      } else {
        this.janusStore.dispatch(requestTrickle(connection_id, candidate))
      }
    })
  }

  setJanusHandler() {
    this.janusStore.subscribe(() => {
      // obtain current session state
      let { connections, lastUpdatedConnection } = this.janusStore.getState().sessions;
      let connection_id = lastUpdatedConnection

      if(!!lastUpdatedConnection === false) return;
      if(!!connections[lastUpdatedConnection] === false) return;

      this.emit('connections/updated', connections, lastUpdatedConnection)

      let connection = connections[connection_id]

      logger.info(`${connection.status}   [${connection_id}]`)

      let is_media = connection.p2p_type === "media"
      switch(connection.status) {
        case RESPONSE_CREATE_ID:
          this.janusStore.dispatch(requestAttach(connection_id, `janus.plugin.${connection.plugin}`))
          break;
        case RESPONSE_ATTACH:
          if(connection.plugin === "streaming") {
            this.janusStore.dispatch(requestStreamingList(connection_id))
          } else {
            this.janusStore.dispatch(requestMediatype(connection_id, {video: is_media, audio: is_media}))
          }
          break;
        case PLUGIN.STREAMING.RESPONSE_LIST:
          this.janusStore.dispatch(requestStreamingWatch(connection_id, 1))
          break;
        case LONGPOLLING_ATTACHED:
          this.janusStore.dispatch(requestOffer(connection_id, {video: is_media, audio: is_media}, connection.offer))
          break;
        case LONGPOLLING_OFFER:
          this.skyway.sendOffer(connection_id, connection.offer, "media")
          break;
        case LONGPOLLING_ANSWER:
          this.skyway.sendAnswer(connection_id, connection.answer, connection.p2p_type)

          // lift restriction to buffer candidates
          this.janusStore.dispatch(setBufferCandidates(connection_id, false))

          // dispatch buffered candidates
          connection.buffCandidates.forEach( candidate =>
            this.janusStore.dispatch(requestTrickle(connection_id, candidate))
          )
          break;
        default:
          break;
      }
    })
  }

  startStreaming(handle_id, src) {
    if(this.skyway.status !== "opened" ) {
      logger.error( "skyway is not opened" );
      return;
    }

    const connection_id = util.createConnectionId("media")

    // since, using streaming plugin does not initiate peer from browser,
    // so we will use connection object in SkyWay connector, explicitly
    this.skyway.updatePeerConnection(connection_id, { src, dst: this.my_peerid })

    this.janusStore.dispatch(setHandleId(connection_id, handle_id));
    this.janusStore.dispatch(requestCreateId(connection_id, {
      offer: null,
      p2p_type: "media",
      plugin: "streaming",
      shouldBufferCandidates: false
    }))
  }

  stopStreaming(handle_id) {
    if(this.skyway.status !== 'opened') {
      logger.error( "skyway is not opened" )
      return;
    }
    let connection_id = this.getConnectionId(handle_id)

    if(connection_id !== "") this.janusStore.dispatch(requestStreamingStop(connection_id))
  }

  getConnectionId(handle_id) {
    let { connections } = this.janusStore.getState().sessions

    for( let connection_id in connections ) {
      let connection = connections[connection_id];
      if(connection.handle_id === handle_id) return connection_id
    }
    return ""
  }
}


module.exports = SignalingController
