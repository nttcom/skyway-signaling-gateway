const { combineReducers } = require('redux')
const {
    REQUEST_CREATE_ID,
    RESPONSE_CREATE_ID,
    REQUEST_ATTACH,
    RESPONSE_ATTACH,
    REQUEST_MEDIATYPE,
    RESPONSE_MEDIATYPE,
    LONGPOLLING_ATTACHED
} = require('./actions')

function sessions(state = {}, action) {
  let session = Object.assign({}, state[action.id], {status: action.type, json: action.json})
  switch (action.type) {
    case REQUEST_CREATE_ID:
    case REQUEST_ATTACH:
    case LONGPOLLING_ATTACHED:
    case RESPONSE_MEDIATYPE:
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
    default:
      return state
  }
}

const reducer = combineReducers({
  sessions
})

module.exports = reducer
