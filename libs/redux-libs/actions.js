/**
 * actions.js
 */


const fetch = require('isomorphic-fetch')
const util  = require('../miscs/util')
const _     = require('underscore')
const log4js = require('log4js')
const logger = log4js.getLogger('redux-action')
const yaml = require('node-yaml')
const path = require('path')

const CONF = yaml.readSync( path.join( process.env.HOME, '/.ssg/janus.yaml') )

const REST_SCHEME = process.env.JANUS_REST_SCHEME || CONF['rest_scheme'];
const ENDPOINT_ADDR = process.env.JANUS_ENDPOINT_ADDR || CONF['endpoint_addr'];
const REST_PORT = process.env.JANUS_REST_PORT || CONF['rest_port'];
const ENDPOINT = `${REST_SCHEME}://${ENDPOINT_ADDR}:${REST_PORT}`;


// constants for actions
const REQUEST_JANUS = 'REQUEST_POST'
const RECEIVE_JANUS = 'RECEIVE_POST'
const RECEIVE_LONGPOLLING = 'RECEIVE_LONGPOLLING'

const SET_OFFER_FROM_SKYWAY = 'SET_OFFER_FROM_SKYWAY'
const SET_ANSWER_FROM_SKYWAY = 'SET_ANSWER_FROM_SKYWAY'

const SET_PLUGIN = 'SET_PLUGIN'
const SET_BUFFER_CANDIDATES = 'SET_BUFFER_CANDIDATES'
const SET_HANDLE_ID = 'SET_HANDLE_ID'
const SET_PAIR_OF_PEERIDS = 'SET_PAIR_OF_PEERIDS'
const REMOVE_CONNECTION = 'REMOVE_CONNECTION'

const PUSH_TRICKLE = 'PUSH_TRICKLE'



// constants for status
const REQUEST_CREATE_ID = 'REQUEST_CREATE_ID'
const RESPONSE_CREATE_ID = 'RESPONSE_CREATE_ID'
const REQUEST_ATTACH = 'REQUEST_ATTACH'
const RESPONSE_ATTACH = 'RESPONSE_ATTACH'
const LONGPOLLING_ATTACHED = 'LONGPOLLING_ATTACHED'
const REQUEST_MEDIATYPE = 'REQUEST_MEDIATYPE'
const RESPONSE_MEDIATYPE = 'RESPONSE_MEDIATYPE'
const REQUEST_OFFER = 'REQUEST_OFFER'
const RESPONSE_OFFER = 'RESPONSE_OFFER'
const REQUEST_ANSWER = 'REQUEST_ANSWER'
const RESPONSE_ANSWER = 'RESPONSE_ANSWER'
const LONGPOLLING_OFFER = 'LONGPOLLING_OFFER'
const LONGPOLLING_ANSWER = 'LONGPOLLING_ANSWER'
const LONGPOLLING_DONE = 'LONGPOLLING_DONE'
const REQUEST_TRICKLE = 'REQUEST_TRICKLE'
const RESPONSE_TRICKLE = 'RESPONSE_TRICKLE'
const REQUEST_TRICKLE_COMPLETED = 'REQUEST_TRICKLE_COMPLETED'
const RESPONSE_TRICKLE_COMPLETED = 'RESPONSE_TRICKLE_COMPLETED'
const LONGPOLLING_WEBRTCUP = 'LONGPOLLING_WEBRTCUP'
const LONGPOLLING_MEDIA = 'LONGPOLLING_MEDIA'
const LONGPOLLING_HANGUP = 'LONGPOLLING_HANGUP'
const LONGPOLLING_KEEPALIVE = 'LONGPOLLING_KEEPALIVE'
const REQUEST_DETACH = 'REQUEST_DETACH'
const RESPONSE_DETACH = 'RESPONSE_DETACH'
const REQUEST_DESTROY = 'REQUEST_DESTROY'
const RESPONSE_DESTROY = 'RESPONSE_DESTROY'
const UNKNOWN = 'UNKNOWN'

const PLUGIN = {
  STREAMING: {
    REQUEST_LIST: 'PLUGIN/STREAMING/REQUEST_LIST',
    RESPONSE_LIST: 'PLUGIN/STREAMING/RESPONSE_LIST',
    REQUEST_WATCH: 'PLUGIN/STREAMING/REQUEST_WATCH',
    RESPONSE_WATCH: 'PLUGIN/STREAMING/RESPONSE_WATCH',
    REQUEST_STOP: 'PLUGIN/STREAMING/REQUEST_STOP',
    RESPONSE_STOP: 'PLUGIN/STREAMING/RESPONSE_STOP',
    LONGPOLLING_STARTING: 'PLUGIN/STREAMING/LONGPOLLING_STARTING',
    LONGPOLLING_STARTED: 'PLUGIN/STREAMING/LONGPOLLING_STARTED',
    LONGPOLLING_STOPPING: 'PLUGIN/STREAMING/LONGPOLLING_STOPPING',
    LONGPOLLING_STOPPED: 'PLUGIN/STREAMING/LONGPOLLING_STOPPED'
  }
}

const EXPECTS = {
  REQUEST_CREATE_ID: RESPONSE_CREATE_ID,
  REQUEST_ATTACH:    RESPONSE_ATTACH,
  REQUEST_MEDIATYPE: RESPONSE_MEDIATYPE,
  REQUEST_OFFER: RESPONSE_OFFER,
  REQUEST_ANSWER: RESPONSE_ANSWER,
  REQUEST_TRICKLE: RESPONSE_TRICKLE,
  REQUEST_TRICKLE_COMPLETED: RESPONSE_TRICKLE_COMPLETED,
  REQUEST_DETACH: RESPONSE_DETACH,
  REQUEST_DESTROY: RESPONSE_DESTROY,
  'PLUGIN/STREAMING/REQUEST_LIST': PLUGIN.STREAMING.RESPONSE_LIST,
  'PLUGIN/STREAMING/REQUEST_WATCH': PLUGIN.STREAMING.RESPONSE_WATCH,
  'PLUGIN/STREAMING/REQUEST_STOP': PLUGIN.STREAMING.RESPONSE_STOP,
}

///////////////////////////////////////////////////////////////
// category : set status
//
///////////////////////////////////////////////////////////////


/**
 * This function will be invoked when OFFER received from skyway.
 * This is just for change status.
 *
 * @param {string} connection_id - connection id
 * @param {object} offer - jsep object of offer
 * @param {string} p2p_type - "media" or "data"
 *
 */
function setOfferFromSkyway(connection_id, offer, p2p_type) {
  return {
    type: SET_OFFER_FROM_SKYWAY,
    connection_id,
    offer,
    p2p_type
  }
}

/**
 * This function will be invoked when ANSWER received from skyway.
 * This is just for change status.
 *
 * @param {string} connection_id - connection id
 * @param {object} answer - jsep object of answer
 * @param {string} p2p_type - "media" or "answer"
 *
 */
function setAnswerFromSkyway(connection_id, answer, p2p_type) {
  return {
    type: SET_ANSWER_FROM_SKYWAY,
    connection_id,
    answer,
    p2p_type
  }
}

/**
 * This function will be invoked when new peer connection establish started.
 * This will update the state of skyway's src and dest peerid
 *
 * @param {string} connection_id - connection id
 * @param {string} client_peer_id - client's peer id
 * @param {string} ssg_peer_id - ssg's peer id
 */
function setPairOfPeerids(connection_id, client_peer_id, ssg_peer_id) {
  return {
    type: SET_PAIR_OF_PEERIDS,
    connection_id,
    client_peer_id,
    ssg_peer_id
  }
}

/**
 * This function will be invoked when handle_id will be given from Janus Gateway skywayiot plugin (identifier of data channel session).
 * This is just for change status.
 *
 * @param {string} connection_id - connection id
 * @param {string} handle_id - handle id (identifier of data channel session)
 */
function setHandleId(connection_id, handle_id) {
  return {
    type: SET_HANDLE_ID,
    connection_id,
    handle_id
  }
}

/**
 * This function will be invoked in initialization process to attach Janus Gateway.
 * This is for storing plugin name of this connection.
 *
 * @param {string} connection_id - connection id
 * @param {plugin} plugin - name of plugin ("skywayiot" or "streaming")
 */
function setPlugin(connection_id, plugin) {
  return {
    type: SET_PLUGIN,
    connection_id,
    plugin
  }
}

/**
 * This function will be invoked in initialization process to attach Janus Gateway.
 * This will create buffer space for ice trickle
 *
 * @param {string} connection_id - connection id
 * @param {boolean} shouldBufferCandidates - flag indicating buffering candidates
 *
 */
function setBufferCandidates(connection_id, flag) {
  return {
    type: SET_BUFFER_CANDIDATES,
    connection_id,
    shouldBufferCandidates: flag
  }
}

/**
 * This will be invoked when request will be sent by fetchJanus()
 *
 * @param {string} connection_id - connection id
 * @param {string} janus_type - type of request message
 * @param {string} transaction - transaction id
 * @param {object} jsonBody - request payload
 *
 */
function requestJanus(connection_id, janus_type, transaction, jsonBody) {
  return {
    type: janus_type,
    connection_id,
    transaction,
    json: jsonBody
  }
}

/**
 * This will be called when response received from Janus.
 * Called in fetchJanus()
 *
 * @param {string} connection_id - connection id
 * @param {string} janus_type - type of response message
 * @param {string} transaction - transaction id
 * @param {object} jsonBody - response payload
 *
 */
function receiveJanus(connection_id, janus_type, transaction, jsonBody) {
  return {
    type: janus_type,
    connection_id,
    transaction,
    json: jsonBody
  }
}

/**
 * This will be called when Signaling Controller receive DELETE connection request
 * from Plugin Connector
 *
 * @param {string} src - src peerid
 */
function removeConnection(src) {
  return {
    type: REMOVE_CONNECTION,
    src
  }
}



///////////////////////////////////////////////////////////////
// category: fetch actions
//
///////////////////////////////////////////////////////////////

/**
 * Start establishing connection to Janus Gateway. This function is used for skywayiot-plugin
 *
 * @param {string} connection_id - connection id
 * @param {object} params
 * @param {object} params.offer - jsep object for offer
 * @param {string} params.p2p_type - "media" or "data"
 * @param {string} params.plugin - "skywayiot"
 * @param {boolean} params.shouldBufferCandidates - flag for buffering canidates
 */
function requestCreateId(connection_id, params = {
  offer: null,
  p2p_type: null,
  plugin: null,
  shouldBufferCandidates: true
}) {
  return (dispatch) => {
    dispatch(setPlugin(connection_id, params.plugin));
    dispatch(setOfferFromSkyway(connection_id, params.offer, params.p2p_type));
    dispatch(setBufferCandidates(connection_id, params.shouldBufferCandidates));
    dispatch(fetchJanus(connection_id, REQUEST_CREATE_ID, {"janus": "create"}))
  }
}

/**
 * Start attaching plugin
 *
 * @param {string} connection_id - connection id
 * @param {string} plugin - "skywayiot" or "streaming"
 *
 */
function requestAttach(connection_id, plugin) {
  return (dispatch, getState) => {
    dispatch(fetchJanus(connection_id, REQUEST_ATTACH, {
      janus: "attach",
      plugin: plugin,
    }))
  }
}

/**
 * Set Mediatype for skywayiot-plugin
 *
 * @param {string} connection_id - connection id
 * @param {object} media_type
 * @param {boolean} media_type.audio - enable audio streaming
 * @param {boolean} media_type.video - enable video streaming
 *
 */
function requestMediatype(connection_id, media_type = {audio: true, video: true}) {
  return dispatch => {
    dispatch(fetchJanus(connection_id, REQUEST_MEDIATYPE, {
      janus: "message",
      body: media_type
    }))
  }
}

/**
 * Send offer request from skyway to Janus Gateway (for skywayiot plugin). It must invoked after plugin attach completed
 *
 * @param {string} connection_id - connection id
 * @param {object} media_type
 * @param {boolean} media_type.audio - enable audio
 * @param {boolean} media_type.video - enable video
 * @param {objcet} jsep - jsep object of offer
 */
function requestOffer(connection_id, media_type = {audio: true, video: true}, jsep) {
  return dispatch => {
    dispatch(fetchJanus(connection_id, REQUEST_OFFER, {
      janus: "message",
      body: media_type,
      jsep
    }))
  }
}

/**
 * Send answer request from skyway to Janus Gateway (for streaming plugin)
 *
 * @param {string} connection_id - connection id
 * @param {object} params
 * @param {object} params.answer - jsep object of answer
 * @param {string} params.p2p_type - "media" or "data"
 * @param {boolean} params.shouldBufferCandidate - flag for buffering candidates
 *
 */
function requestAnswer(connection_id, params = {
  answer: null,
  p2p_type: null,
  shouldBufferCandidates: false
}) {
  return dispatch => {
    dispatch(setAnswerFromSkyway(connection_id, params.answer, params.p2p_type))
    dispatch(setBufferCandidates(connection_id, params.shouldBufferCandidates))
    dispatch(fetchJanus(connection_id, REQUEST_ANSWER, {
      janus: "message",
      body: {
        request: "start"
      },
      jsep: params.answer
    }))
  }
}

/**
 * Push ICE candidate to buffer
 *
 * @param {string} connection_id - connection id
 * @param {object} candidate - jsep object of ice candidate
 *
 */
function pushTrickle(connection_id, candidate) {
  return {
    type: PUSH_TRICKLE,
    connection_id,
    candidate
  }
}

/**
 * Send ICE candidate to JanusGateway
 *
 * @param {string} connection_id - connection id
 * @param {object} jsep object of ice candidate
 *
 */
function requestTrickle(connection_id, candidate) {
  return dispatch => {
    dispatch(fetchJanus(connection_id, REQUEST_TRICKLE, {
      janus: "trickle",
      candidate
    }))
  }
}

/**
 * Send streaming list request to Janus Gateway. This is used for streaming plugin.
 *
 * @param {string} connection_id - connection id
 *
 */
function requestStreamingList(connection_id) {
  return dispatch => {
    dispatch(fetchJanus(connection_id, PLUGIN.STREAMING.REQUEST_LIST, {
      janus: "message",
      body: {
        request: "list"
      }
    }))
  }
}

/**
 * Send watch request to Janus Gateway. This is used for streaming plugin.
 *
 * @param {string} connection_id - connection id
 * @param {integer} stream_id - stream id
 *
 */
function requestStreamingWatch(connection_id, stream_id) {
  return dispatch => {
    dispatch(fetchJanus(connection_id, PLUGIN.STREAMING.REQUEST_WATCH, {
      janus: "message",
      body: {
        request: "watch",
        id: stream_id
      }
    }))
  }
}

/**
 * Send streaming stop request to Janus gateway. This is for streaming plugin.
 *
 * @param {string} connection_id - connection id
 *
 */
function requestStreamingStop(connection_id) {
  return dispatch => {
    dispatch(fetchJanus(connection_id, PLUGIN.STREAMING.REQUEST_STOP, {
      janus: "message",
      body : {
        request: "stop"
      }
    }))
  }
}




/////////////////////////////////////////////////////////////////////
// category: network handlers
//
/////////////////////////////////////////////////////////////////////

/**
 * This function is to process event message from Janus Gateway.
 * Event messages are offer, answer, webrtcup etc.
 * It will be called inside of startLongPolling()
 *
 * @param {string} connection_id - connection id
 * @param {object} json - event message payload
 *
 */
function receiveLongPolling(connection_id, json) {
  if(json.janus === "event") {
    // find action type, based on json message received.
    //
    if(json.plugindata && json.transaction && json.jsep && json.jsep.type === "answer") {
      // ANSER event
      return {
        type: LONGPOLLING_ANSWER,
        connection_id,
        json
      }
    } else if(json.plugindata && json.transaction && json.jsep && json.jsep.type === "offer") {
      // OFFER event
      return {
        type: LONGPOLLING_OFFER,
        connection_id,
        json
      }
    } else if(json.plugindata && json.transaction && !json.jsep && json.plugindata.data && json.plugindata.data.result === 'ok') {
      // ATTACHED to plugin
      return {
        type: LONGPOLLING_ATTACHED,
        connection_id,
        json
      }
    } else if(json.plugindata && !json.transaction && !json.jsep) {
      // DONE event
      return {
        type: LONGPOLLING_DONE,
        connection_id,
        json
      }
    } else if(json.plugindata && json.plugindata.plugin === "janus.plugin.streaming" && json.plugindata.data && json.plugindata.data.result && json.plugindata.data.result.status === "starting") {
      // streaming is starting
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STARTING,
        connection_id,
        json
      }
    } else if(json.plugindata && json.plugindata.plugin === "janus.plugin.streaming" && json.plugindata.data && json.plugindata.data.result && json.plugindata.data.result.status === "started") {
      // streaming is started
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STARTED,
        connection_id,
        json
      }
    } else if(json.plugindata && json.plugindata.plugin === "janus.plugin.streaming" && json.plugindata.data && json.plugindata.data.result && json.plugindata.data.result.status === "stopping") {
      // streaming is stopping
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STOPPING,
        connection_id,
        json
      }
    } else if(json.plugindata && json.plugindata.plugin === "janus.plugin.streaming" && json.plugindata.data && json.plugindata.data.result && json.plugindata.data.result.status === "stopped") {
      // streaming is stopped
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STOPPED,
        connection_id,
        json
      }
    }
  } else if (json.janus === "webrtcup") {
    // when p2p is established
    return {
      type: LONGPOLLING_WEBRTCUP,
      connection_id,
      json
    }
  } else if (json.janus === "media") {
    // media event
    return {
      type: LONGPOLLING_MEDIA,
      connection_id,
      json
    }
  } else if (json.janus === "keepalive"){
    // keepalive message event
    return {
      type: LONGPOLLING_KEEPALIVE,
      connection_id,
      json
    }
  } else if (json.janus === "hangup") {
    // when p2p has hangupped
    return {
      type: LONGPOLLING_HANGUP,
      connection_id,
      json
    }
  } else {
    return {
      type: UNKNOWN,
      connection_id,
      json
    }
  }
}


/**
 * This is for to handle event via long polling interface from Janus.
 * This function will be repeatedly called by itself until session would be termintated.
 *
 * @param {string} connection_id - connection id
 *
 */
function startLongPolling(connection_id) {
  return (dispatch, getState) => {
    let { connections }  = getState().sessions
    let session_id = connections[connection_id] && connections[connection_id].session_id

    if(!!session_id === false) {
      logger.warn("can't find session_id, maybe attach plugin failed");
      return;
    }
    let path = _.compact(['janus', session_id]).join("/")

    path = `${path}?rid=${Date.now()}&maxev=1&_=${Date.now()}`

    // start fetch
    fetch(`${ENDPOINT}/${path}`)
      .then( response => {
        if(response.ok) {
          return response.json()
        } else {
          // when response is ng
          logger.warn("response of long polling is not ok");
          logger.warn(response.text());

          return null
        }
      } )
      .then( json => {
        if(json === null) {
          // when response is ng, just restart long polling
          dispatch(startLongPolling(connection_id))
        } else {
          // dispatch reciveLongPolling function to change start
          dispatch(receiveLongPolling(connection_id, json))

          // while connection alive, do long polling.
          let currCons = getState().sessions.connections
          if(currCons[connection_id]) dispatch(startLongPolling(connection_id))
        }
      })
  }
}

/**
 * This function will be used to send request to Janus Gateway
 *
 * @param {string} connection_id - connection id
 * @param {string} janus_type - type of request message
 * @param {object} jsonBody - request message payload
 */
function fetchJanus(connection_id, janus_type, jsonBody) {
  return (dispatch, getState) => {
    // obtain current state for this connection_id
    let { connections } = getState().sessions
    let session_id = connections[connection_id] && connections[connection_id].session_id
    let attach_id = connections[connection_id] && connections[connection_id].attach_id

    // create entry point path and transaction id
    let path = _.compact(['janus', session_id, attach_id]).join("/")
    let transaction = util.createTransactionId();

    // create request payload
    jsonBody = Object.assign({}, jsonBody, {transaction})

    // dispatch requestJanus to refresh current status
    dispatch(requestJanus(connection_id, janus_type, transaction, jsonBody))

    // setup header for this fetch
    let headers = new Headers()
    headers.append("Content-Type", "application/json")

    // setup option parameter for this fetch
    let body = JSON.stringify(jsonBody)
    let opts = {
      method: 'POST',
      headers,
      body
    }

    return fetch(`${ENDPOINT}/${path}`, opts)
      .then(response => {
        if(response.ok) {
          return response.json()
        } else {
          logger.warn(response.text())
          return null
        }
      })
      .then(json => {
        if(json) {
          // get response type of this transaction
          let expect_type = EXPECTS[janus_type]

          // dispatch receiveJanus to change state
          dispatch(receiveJanus(connection_id, expect_type, transaction, json))

          // when expect_type equal RESPONSE_CREATE_ID, start Long Polling
          if(expect_type === RESPONSE_CREATE_ID) dispatch(startLongPolling(connection_id))
        }
      })
  }
}



module.exports = {
  ENDPOINT,
  REQUEST_CREATE_ID,
  RESPONSE_CREATE_ID,
  REQUEST_ATTACH,
  RESPONSE_ATTACH,
  LONGPOLLING_ATTACHED,
  REQUEST_MEDIATYPE,
  RESPONSE_MEDIATYPE,
  REQUEST_OFFER,
  RESPONSE_OFFER,
  REQUEST_ANSWER,
  RESPONSE_ANSWER,
  LONGPOLLING_OFFER,
  LONGPOLLING_ANSWER,
  LONGPOLLING_DONE,
  REQUEST_TRICKLE,
  RESPONSE_TRICKLE,
  REQUEST_TRICKLE_COMPLETED,
  RESPONSE_TRICKLE_COMPLETED,
  LONGPOLLING_WEBRTCUP,
  LONGPOLLING_MEDIA,
  LONGPOLLING_HANGUP,
  LONGPOLLING_KEEPALIVE,
  REQUEST_DETACH,
  RESPONSE_DETACH,
  REQUEST_DESTROY,
  RESPONSE_DESTROY,
  PLUGIN,
  UNKNOWN,
  SET_OFFER_FROM_SKYWAY,
  SET_ANSWER_FROM_SKYWAY,
  SET_HANDLE_ID,
  SET_PLUGIN,
  SET_BUFFER_CANDIDATES,
  SET_PAIR_OF_PEERIDS,
  PUSH_TRICKLE,
  REMOVE_CONNECTION,
  requestMediatype,
  requestAttach,
  requestCreateId,
  requestOffer,
  requestAnswer,
  requestTrickle,
  requestStreamingList,
  requestStreamingWatch,
  requestStreamingStop,
  pushTrickle,
  setBufferCandidates,
  setHandleId,
  setPairOfPeerids,
  setOfferFromSkyway,
  setAnswerFromSkyway,
  setPairOfPeerids,
  setPlugin,
  requestJanus,
  receiveJanus,
  removeConnection
}
