const store = require('./redux-libs/store')

const Skyway = require('./Connector/Skyway')
const {
  RESPONSE_CREATE_ID,
  RESPONSE_ATTACH,
  RESPONSE_MEDIATYPE,
  RESPONSE_OFFER,
  LONGPOLLING_ATTACHED,
  LONGPOLLING_ANSWER,
  requestCreateId,
  requestAttach,
  requestMediatype,
  requestOffer,
  requestTrickle
} = require('./redux-libs/actions')

// ignore self signed tls connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED="0"


// test code for echotest
if(true) {

  let skyway = new Skyway({option:{peerid: "SSG_komasshu"}})

  let states = {
  }

  // skyway.on("event", (type, mesg) => console.log(`${type}`))
  skyway.on("receive/offer", (id, offer) => {
    let state = states[id] || {candidates: []}
    states[id] = Object.assign({}, state, {offer})
    store.dispatch(requestCreateId(id))
  })

  skyway.on("receive/answer", (id, answer) => {
    let state = states[id] || {candidates: []}
    states[id] = Object.assign({}, state, {answer})
    // store.dispatch(requestAnswer(id, answer))
  })

  skyway.on("receive/candidate", (id, candidate) => {
    let state = states[id] || {candidates: []}
    states[id] = Object.assign({}, state, {candidates: [ ...state.candidates, candidate]})
  })

  skyway.connect();


  store.subscribe(() => {
    let { sessions } = store.getState();
    $("#state pre").text(JSON.stringify(store.getState(), 2, " "))
    for( let id in sessions ) {
      let session = sessions[id]
      switch(session.status) {
        case RESPONSE_CREATE_ID:
          store.dispatch(requestAttach(id, "janus.plugin.echotest"))
          break;
        case RESPONSE_ATTACH:
          store.dispatch(requestMediatype(id, {video: true, audio: true}))
          break;
        case RESPONSE_MEDIATYPE:
          break;
        case LONGPOLLING_ATTACHED:
          store.dispatch(requestOffer(id, {video: true, audio: true}, states[id].offer))
          break;
        case LONGPOLLING_ANSWER:
          skyway.sendAnswer(id, session.answer, "media")
          states[id].candidates.forEach( candidate =>
            store.dispatch(requestTrickle(id, candidate))
          )
          break;
        default:
          break;
      }
    }
  })
}
