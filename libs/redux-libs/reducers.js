const { combineReducers } = require('redux')
const {
    REQUEST_CREATE_ID,
    RESPONSE_CREATE_ID,
    REQUEST_ATTACH,
    RESPONSE_ATTACH,
    REQUEST_MEDIATYPE,
    RESPONSE_MEDIATYPE,
    LONGPOLLING_ATTACHED,
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
    SET_OFFER_FROM_SKYWAY,
    SET_ANSWER_FROM_SKYWAY,
    SET_HANDLE_ID,
    SET_PLUGIN,
    SET_BUFFER_CANDIDATES,
    SET_PAIR_OF_PEERIDS,
    PUSH_TRICKLE,
} = require('./actions')


/**
 * update sessions from action message
 * 
 * @param {object} state - previous session state
 * @param {object} action - action object
 * 
 */
function sessions(state = { connections : {}, lastUpdatedConnection: null}, action) {
  let connection = Object.assign({}, state.connections[action.connection_id], {status: action.type, json: action.json})

  switch (action.type) {
    case REQUEST_CREATE_ID:
    case REQUEST_ATTACH:
    case LONGPOLLING_ATTACHED:
    case RESPONSE_MEDIATYPE:
    case REQUEST_OFFER:
    case RESPONSE_OFFER:
    case REQUEST_ANSWER:
    case RESPONSE_ANSWER:
    case LONGPOLLING_DONE:
    case REQUEST_TRICKLE:
    case RESPONSE_TRICKLE:
    case REQUEST_TRICKLE_COMPLETED:
    case RESPONSE_TRICKLE_COMPLETED:
    case LONGPOLLING_WEBRTCUP:
    case LONGPOLLING_MEDIA:
    case LONGPOLLING_KEEPALIVE:
    case REQUEST_DETACH:
    case RESPONSE_DETACH:
    case REQUEST_DESTROY:
    case RESPONSE_DESTROY:
    case PLUGIN.STREAMING.REQUEST_LIST:
    case PLUGIN.STREAMING.REQUEST_WATCH:
    case PLUGIN.STREAMING.REQUEST_STOP:
    case PLUGIN.STREAMING.RESPONSE_LIST:
    case PLUGIN.STREAMING.RESPONSE_WATCH:
    case PLUGIN.STREAMING.RESPONSE_STOP:
    case PLUGIN.STREAMING.LONGPOLLING_STARTING:
    case PLUGIN.STREAMING.LONGPOLLING_STARTED:
    case PLUGIN.STREAMING.LONGPOLLING_STOPPING:
    case PLUGIN.STREAMING.LONGPOLLING_STOPPED:
      break;
    case SET_PAIR_OF_PEERIDS:
      connection = Object.assign({}, connection, { peerids: { client: action.client_peer_id, ssg: action.ssg_peer_id }})
      break;
    case SET_PLUGIN:
      connection = Object.assign({}, connection, {plugin: action.plugin});
      break;
    case SET_HANDLE_ID:
      connection = Object.assign({}, connection, {handle_id: action.handle_id});
      break;
    case SET_BUFFER_CANDIDATES:
      connection = Object.assign({}, connection, {shouldBufferCandidates: action.shouldBufferCandidates, });
      break;
    case SET_OFFER_FROM_SKYWAY:
      connection = Object.assign({}, connection, {offer: action.offer, p2p_type: action.p2p_type});
      break;
    case SET_ANSWER_FROM_SKYWAY:
      connection = Object.assign({}, connection, {answer: action.answer, p2p_type: action.p2p_type});
      break;
    case PUSH_TRICKLE:
      // In case of 1st ice trickle, buffCandidates will be undefined. To prevent error, we'll initialize buffer in this case.
      var prevBuff = connection.buffCandidates || []
      connection = Object.assign({}, connection, {buffCandidates: [ ...prevBuff, action.candidate ]});
      break;
    case RESPONSE_CREATE_ID:
      connection = Object.assign({}, connection, {session_id: action.json.data.id})
      break;
    case RESPONSE_ATTACH:
      connection = Object.assign({}, connection, {attach_id: action.json.data.id})
      break;
    case REQUEST_MEDIATYPE:
      connection = Object.assign({}, connection, {media_type: action.json.body})
      break;
    case LONGPOLLING_OFFER:
      connection = Object.assign({}, connection, {offer: action.json.jsep})
      break;
    case LONGPOLLING_ANSWER:
      connection = Object.assign({}, connection, {answer: action.json.jsep})
      break;
    case LONGPOLLING_HANGUP:
      delete state.connections[action.connection_id]
      var connections = Object.assign({}, state.connections);

      return Object.assign({}, state, {
        lastUpdatedConnection: action.connection_id,
        connections
      })
    default:
      return state
  }

  var connections = Object.assign({}, state.connections, { [action.connection_id]: connection });

  return Object.assign({}, state, {
    lastUpdatedConnection: action.connection_id,
    connections
  })

}

/**
 * reducder setting
 * 
 */
const reducer = combineReducers({
  sessions
})

module.exports = reducer
