/**
 * actions.js
 */
const fetch = require('isomorphic-fetch')
const util  = require('../miscs/util')
const _     = require('underscore')

const ENDPOINT = 'https://192.168.33.10:8089'

// constants for actions
const REQUEST_JANUS = 'REQUEST_POST'
const RECEIVE_JANUS = 'RECEIVE_POST'
const RECEIVE_LONGPOLLING = 'RECEIVE_LONGPOLLING'

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
function requestJanus(id, janus_type, transaction, jsonBody) {
  console.log(janus_type)
  return {
    type: janus_type,
    id,
    transaction,
    json: jsonBody
  }
}

function receiveJanus(id, janus_type, transaction, json) {
  return {
    type: janus_type,
    id,
    transaction,
    json
  }
}

function receiveLongPolling(id, json) {
  if(json.janus === "event") {
    if(json.plugindata && json.transaction && json.jsep && json.jsep.type === "answer") {
      return {
        type: LONGPOLLING_ANSWER,
        id,
        json
      }
    } else if(json.plugindata && json.transaction && json.jsep && json.jsep.type === "offer") {
      return {
        type: LONGPOLLING_OFFER,
        id,
        json
      }
    } else if(json.plugindata && json.transaction && !json.jsep) {
      return {
        type: LONGPOLLING_ATTACHED,
        id,
        json
      }
    } else if(json.plugindata && !json.transaction && !json.jsep) {
      return {
        type: LONGPOLLING_DONE,
        id,
        json
      }
    } else if(json.plugindata && janus.plugindata.plugin === "janus.plugin.streaming" && janus.plugindata.data && janus.plugindata.result && janus.plugindata.result.status === "starting") {
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STARTING,
        id,
        json
      }
    } else if(json.plugindata && janus.plugindata.plugin === "janus.plugin.streaming" && janus.plugindata.data && janus.plugindata.result && janus.plugindata.result.status === "started") {
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STARTED,
        id,
        json
      }
    } else if(json.plugindata && janus.plugindata.plugin === "janus.plugin.streaming" && janus.plugindata.data && janus.plugindata.result && janus.plugindata.result.status === "stopping") {
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STOPPING,
        id,
        json
      }
    } else if(json.plugindata && janus.plugindata.plugin === "janus.plugin.streaming" && janus.plugindata.data && janus.plugindata.result && janus.plugindata.result.status === "stopped") {
      return {
        type: PLUGIN.STREAMING.LONGPOLLING_STOPPED,
        id,
        json
      }
    }
  } else if (json.janus === "webrtcup") {
    return {
      type: LONGPOLLING_WEBRTCUP,
      id,
      json
    }
  } else if (json.janus === "media") {
    return {
      type: LONGPOLLING_MEDIA,
      id,
      json
    }
  } else if (json.janus === "keepalive"){
    return {
      type: LONGPOLLING_KEEPALIVE,
      id,
      json
    }
  } else if (json.janus === "hangup") {
    return {
      type: LONGPOLLING_HANGUP,
      id,
      json
    }
  } else {
    return {
      type: UNKNOWN,
      id,
      json
    }
  }
}

function startLongPolling(id) {
  return (dispatch, getState) => {
    let state = getState()
    let session_id = state.sessions[id] && state.sessions[id].session_id
    let path = _.compact(['janus', session_id]).join("/")

    path = `${path}?rid=${Date.now()}&maxev=1&_=${Date.now()}`

    return fetch(`${ENDPOINT}/${path}`)
      .then( response => response.json() )
      .then( json => {
        dispatch(startLongPolling(id))
        // fixme : longpolling must be stopped when session terminated.
        dispatch(receiveLongPolling(id, json))
      })
  }
}

function fetchJanus(id, janus_type, jsonBody) {
  return (dispatch, getState) => {
    let state = getState()
    let session_id = state.sessions[id] && state.sessions[id].session_id
    let attach_id = state.sessions[id] && state.sessions[id].attach_id
    let path = _.compact(['janus', session_id, attach_id]).join("/")
    let transaction = util.createTransactionId();

    jsonBody = Object.assign({}, jsonBody, {transaction})
    dispatch(requestJanus(id, janus_type, transaction, jsonBody))

    // if(janus_type === REQUEST_ATTACH) dispatch(startLongPolling(id))
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
      .then(response => response.json())
      .then(json => {
        dispatch(receiveJanus(id, expect_type, transaction, json))
        if(expect_type === RESPONSE_CREATE_ID) dispatch(startLongPolling(id))
      })
  }
}

// exports


function requestCreateId(id) {
  return (dispatch) => {
    return dispatch(fetchJanus(id, REQUEST_CREATE_ID, {"janus": "create"}))
  }
}

function requestAttach(id, plugin) {
  return (dispatch, getState) => {
    dispatch(fetchJanus(id, REQUEST_ATTACH, {
      janus: "attach",
      plugin: plugin,
    }))
  }
}


function requestMediatype(id, media_type = {audio: true, video: true}) {
  return dispatch => {
    dispatch(fetchJanus(id, REQUEST_MEDIATYPE, {
      janus: "message",
      body: media_type
    }))
  }
}


function requestOffer(id, media_type = {audio: true, video: true}, jsep) {
  return dispatch => {
    dispatch(fetchJanus(id, REQUEST_OFFER, {
      janus: "message",
      body: media_type,
      jsep
    }))
  }
}

function requestAnswer(id, jsep) {
  return dispatch => {
    dispatch(fetchJanus(id, REQUEST_ANSWER, {
      janus: "message",
      body: {
        request: "start"
      },
      jsep
    }))
  }
}

function requestTrickle(id, candidate) {
  return dispatch => {
    dispatch(fetchJanus(id, REQUEST_TRICKLE, {
      janus: "trickle",
      candidate
    }))
  }
}

function requestStreamingList(id) {
  return dispatch => {
    dispatch(fetchJanus(id, PLUGIN.STREAMING.REQUEST_LIST, {
      janus: "message",
      body: {
        request: "list"
      }
    }))
  }
}

function requestStreamingWatch(id, stream_id) {
  return dispatch => {
    dispatch(fetchJanus(id, PLUGIN.STREAMING.REQUEST_WATCH, {
      janus: "message",
      body: {
        request: "watch",
        id: stream_id
      }
    }))
  }
}

function requestStreamingStop(id) {
  return dispatch => {
    dispatch(fetchJanus(id, PLUGIN.STREAMING.REQUEST_STOP, {
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
  requestMediatype,
  requestAttach,
  requestCreateId,
  requestOffer,
  requestAnswer,
  requestTrickle,
  requestStreamingList,
  requestStreamingWatch,
  requestStreamingStop
}
