const store = require('./store')
const {
  RESPONSE_CREATE_ID,
  RESPONSE_ATTACH,
  RESPONSE_MEDIATYPE,
  requestCreateId,
  requestAttach,
  requestMediatype
} = require('./actions')

if(true) {

  store.subscribe(() => {
    let { sessions } = store.getState();
    for( let id in sessions ) {
      let session = sessions[id]
      switch(session.status) {
        case RESPONSE_CREATE_ID:
          store.dispatch(requestAttach(id, "janus.plugin.echotest"))
          break;
        case RESPONSE_ATTACH:
          store.dispatch(requestMediatype(id, {video: true, audio: true}))
          break;
        default:
      }
    }
  })
  store.dispatch(requestCreateId("123"))
}
