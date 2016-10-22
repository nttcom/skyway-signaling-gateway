const janusStore = require('./redux-libs/store')
const Skyway = require('./Connector/Skyway')

const Controller = require('./controller')

// ignore self signed tls connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED="0"


// test code for echotest
if(true) {
  var controller = new Controller('SSG_komasshu', janusStore, Skyway)

  /**
   * just for UI test
   *
   */
  // just dispaly current state
  controller.on("sessions_updated", sessions => {
    $("#state pre").text(JSON.stringify(sessions, 2, " "))
  })

  $("#startstreaming").on("click", ev => {
    console.log("start streaming")
    console.log(ev.target.dataset.peerid)
    let src = $("#mypeerid").val()
    if(!!src) controller.startStreaming(src);
  })

}
