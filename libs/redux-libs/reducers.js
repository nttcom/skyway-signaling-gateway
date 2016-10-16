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
    LONGPOLLING_HANGUP,
    LONGPOLLING_KEEPALIVE,
    REQUEST_DETACH,
    RESPONSE_DETACH,
    REQUEST_DESTROY,
    RESPONSE_DESTROY
} = require('./actions')

function sessions(state = {}, action) {
  let session = Object.assign({}, state[action.id], {status: action.type, json: action.json})
  switch (action.type) {
    case REQUEST_CREATE_ID:
    case REQUEST_ATTACH:
    case LONGPOLLING_ATTACHED:
    case RESPONSE_MEDIATYPE:
    case REQUEST_OFFER:
    case RESPONSE_OFFER:
    case REQUEST_ANSWER:
    case RESPONSE_ANSWER:
    case LONGPOLLING_OFFER:
    case LONGPOLLING_DONE:
    case REQUEST_TRICKLE:
    case RESPONSE_TRICKLE:
    case REQUEST_TRICKLE_COMPLETED:
    case RESPONSE_TRICKLE_COMPLETED:
    case LONGPOLLING_HANGUP:
    case LONGPOLLING_KEEPALIVE:
    case REQUEST_DETACH:
    case RESPONSE_DETACH:
    case REQUEST_DESTROY:
    case RESPONSE_DESTROY:
      return Object.assign({}, state, {[action.id]: session})
    case RESPONSE_CREATE_ID:
      session = Object.assign({}, session, {session_id: action.json.data.id})
      return Object.assign({}, state, {[action.id]:session})
    case RESPONSE_ATTACH:
      session = Object.assign({}, session, {attach_id: action.json.data.id})
      return Object.assign({}, state, {[action.id]:session})
    case REQUEST_MEDIATYPE:
      session = Object.assign({}, session, {media_type: action.json.body})
      return Object.assign({}, state, {[action.id]:session})
    case LONGPOLLING_ANSWER:
      session = Object.assign({}, session, {answer: action.json.jsep})
      return Object.assign({}, state, {[action.id]:session})
    default:
      return state
  }
}

const reducer = combineReducers({
  sessions
})

module.exports = reducer
