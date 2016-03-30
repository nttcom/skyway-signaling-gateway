/* skyway.test.js */
var Peer = require('peerjs')
  , PeerCustomMessage = require('skyway-cusotom-messaging')
  , util = require('../../libs/util')

describe("pcm test", () => {
  let peer = new Peer({key: "db07bbb6-4ee8-4eb7-b0c2-b8b2e5c69ef9"});

  peer.on("open", (id) => {
    let peers = [];

    peer.listAllPeers((list) => {
      list.forEach((peerid) => {
        console.log(peerid);
        if(peerid.indexOf("SSG_") === 0) peers.push(peerid);
      });

      console.log(peers);
      var pcm = new PeerCustomMessage(peer, "JANUS");

      var transaction_id = util.randomStringForJanus(12)
        , param = { "janus": "create", "transaction": transaction_id };
      console.log(param);

      pcm.get(peers[0], '/create', param, (res) => {
        console.log(res);
      });
    });

  });
});
