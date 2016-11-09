/**
 * actions.js
 */
const CONF = require('../../conf/janus.json')


const fetch = require('isomorphic-fetch')
const util  = require('../miscs/util')
const _     = require('underscore')

const ENDPOINT = CONF['rest_scheme'] + "://" + CONF['endpoint_addr'] + ":" + CONF['rest_port']

// constants for actions
const REQUEST_JANUS = 'REQUEST_POST'
const RECEIVE_JANUS = 'RECEIVE_POST'
const RECEIVE_LONGPOLLING = 'RECEIVE_LONGPOLLING'

const SET_OFFER_FROM_SKYWAY = 'SET_OFFER_FROM_SKYWAY'
const SET_ANSWER_FROM_SKYWAY = 'SET_ANSWER_FROM_SKYWAY'

const SET_PLUGIN = 'SET_PLUGIN'
const SET_BUFFER_CANDIDATES = 'SET_BUFFER_CANDIDATES'
const SET_HANDLE_ID = 'SET_HANDLE_ID'

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

// actions
function requestJanus(connection_id, janus_type, transaction, jsonBody) {
  return {
    type: janus_type,
    connection_id,
    transaction,
    json: jsonBody
  }
}

function receiveJanus(connection_id, janus_type, transaction, json) {
  return {
    type: janus_type,
    connection_id,
    transaction,
    json
  }
}

function receiveLongPolling(connection_id, json) {
  if(json.janus === "event") {
    if(json.plugindata && json.transaction && json.jsep && json.jsep.type === "answer") {
      return {
        type: LONGPOLLING_ANSWER,
        connection_id,
        json
      }
    } else if(json.plugindata && json.transaction && json.jsep && json.jsep.type === "offer") {
      return {
        type: LONGPOLLING_OFFER,
        connection_id,
        json
      }
    } else if(json.plugindata && json.transaction && !json.jsep && json.plugindata.data && json.plugindata.data.result === 'ok') {
      return {
        type: LONGPOLLING_ATTACHED,
        connection_id,
        json
      }
    } else if(json.plugindata && !json.transaction && !json.jsep) {
      return {
        type: LONGPOLLING_DONE,
        connection_id,
        json
      }
    } else if(json.plugindata && json.plugindata.plugin === "janus.plugin.streaming" && json.plugindata.data && json.plugindata.data.result && json.plugindata.data.result.status === "starting") {
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STARTING,
        connection_id,
        json
      }
    } else if(json.plugindata && json.plugindata.plugin === "janus.plugin.streaming" && json.plugindata.data && json.plugindata.data.result && json.plugindata.data.result.status === "started") {
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STARTED,
        connection_id,
        json
      }
    } else if(json.plugindata && json.plugindata.plugin === "janus.plugin.streaming" && json.plugindata.data && json.plugindata.data.result && json.plugindata.data.result.status === "stopping") {
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STOPPING,
        connection_id,
        json
      }
    } else if(json.plugindata && json.plugindata.plugin === "janus.plugin.streaming" && json.plugindata.data && json.plugindata.data.result && json.plugindata.data.result.status === "stopped") {
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STOPPED,
        connection_id,
        json
      }
    }
  } else if (json.janus === "webrtcup") {
    return {
      type: LONGPOLLING_WEBRTCUP,
      connection_id,
      json
    }
  } else if (json.janus === "media") {
    return {
      type: LONGPOLLING_MEDIA,
      connection_id,
      json
    }
  } else if (json.janus === "keepalive"){
    return {
      type: LONGPOLLING_KEEPALIVE,
      connection_id,
      json
    }
  } else if (json.janus === "hangup") {
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

    return fetch(`${ENDPOINT}/${path}`)
      .then( response => {
        if(response.ok) {
          return response.json()
        } else {
          logger.warn("response of long polling is not ok");
          logger.warn(response.text());
        }
      } )
      .then( json => {
        dispatch(receiveLongPolling(connection_id, json))

        // while connection alive, do long polling.
        let currCons = getState().sessions.connections
        if(currCons[connection_id]) dispatch(startLongPolling(connection_id))
      })
  }
}

function fetchJanus(connection_id, janus_type, jsonBody) {
  return (dispatch, getState) => {
    let { connections } = getState().sessions
    let session_id = connections[connection_id] && connections[connection_id].session_id
    let attach_id = connections[connection_id] && connections[connection_id].attach_id
    let path = _.compact(['janus', session_id, attach_id]).join("/")
    let transaction = util.createTransactionId();

    jsonBody = Object.assign({}, jsonBody, {transaction})
    dispatch(requestJanus(connection_id, janus_type, transaction, jsonBody))

    // if(janus_type === REQUEST_ATTACH) dispatch(startLongPolling(connection_id))
    // fixme: longpolling must be stopped, when terminated

    let headers = new Headers()
    headers.append("Content-Type", "application/json")

    let body = JSON.stringify(jsonBody)
    let expect_type = EXPECTS[janus_type]

    let opts = {
      method: 'POST',
      headers,
      body
    }
    return fetch(`${ENDPOINT}/${path}`, opts)
      .then(response => response.json() )
      .then(json => {
        dispatch(receiveJanus(connection_id, expect_type, transaction, json))
        if(expect_type === RESPONSE_CREATE_ID) dispatch(startLongPolling(connection_id))
      })
  }
}

// exports
function setOfferFromSkyway(connection_id, offer, p2p_type) {
  return {
    type: SET_OFFER_FROM_SKYWAY,
    connection_id,
    offer,
    p2p_type
  }
}

function setAnswerFromSkyway(connection_id, answer, p2p_type) {
  return {
    type: SET_ANSWER_FROM_SKYWAY,
    connection_id,
    answer,
    p2p_type
  }
}

function setHandleId(connection_id, handle_id) {
  return {
    type: SET_HANDLE_ID,
    connection_id,
    handle_id
  }
}

function setPlugin(connection_id, plugin) {
  return {
    type: SET_PLUGIN,
    connection_id,
    plugin
  }
}

function setBufferCandidates(connection_id, flag) {
  return {
    type: SET_BUFFER_CANDIDATES,
    connection_id,
    shouldBufferCandidates: flag
  }
}

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

function requestAttach(connection_id, plugin) {
  return (dispatch, getState) => {
    dispatch(fetchJanus(connection_id, REQUEST_ATTACH, {
      janus: "attach",
      plugin: plugin,
    }))
  }
}


function requestMediatype(connection_id, media_type = {audio: true, video: true}) {
  return dispatch => {
    dispatch(fetchJanus(connection_id, REQUEST_MEDIATYPE, {
      janus: "message",
      body: media_type
    }))
  }
}


function requestOffer(connection_id, media_type = {audio: true, video: true}, jsep) {
  return dispatch => {
    dispatch(fetchJanus(connection_id, REQUEST_OFFER, {
      janus: "message",
      body: media_type,
      jsep
    }))
  }
}

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

function pushTrickle(connection_id, candidate) {
  return {
    type: PUSH_TRICKLE,
    connection_id,
    candidate
  }
}

function requestTrickle(connection_id, candidate) {
  return dispatch => {
    dispatch(fetchJanus(connection_id, REQUEST_TRICKLE, {
      janus: "trickle",
      candidate
    }))
  }
}

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
  PUSH_TRICKLE,
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
  setHandleId
}
