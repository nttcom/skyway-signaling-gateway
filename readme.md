# SSG - Skyway Signaling Gateway

Signaling Gateway Server for Skyway and Janus Gateway

## required software

* Install Janus Gateway
  - [janus-skywayiot-pulugin](https://github.com/eastandwest/janus-skywayiot-plugin) MUST be applied to it.
  - https MUST be enabled
  - for more detail, see https://github.com/eastandwest/signalinggateway-vagrant/blob/master/provisioning/roles/janus/tasks/main.yml
* setup SkyWay account
  - You don't have it? You can have it at https://skyway.io/ds/.
  - Then create API key and set origin setting

## how to setup

```bash
$ cp conf/skyway.json.tmpl conf/skyway.yaml
```

You need to change skwyay.yaml. At least, you have to replace your api key setting.

# run SSG

```bash
$ node app
```

# how to talk to Janus Gateway leveraging SkyWay SDK

We support three feature between client and Janus Gateway.

1. bidirectional data channel communication
  - 3rd party interface for this is TCP (by default 15000)
2. one-way media stream from Janus Gateway
3. one-way voice stream to Janus Gateway
  - 3rd party interface for this is UDP (by default 25000)

Below, we'll show up web Snipets for web app, iOS, Android to utilize these features leveraging [SkyWay SDK](http://nttcom.github.io/skyway/en/index.html).

## web app

### initialize peer

```javascript
const mypeerid;
const peer = new Peer(key: MY_APIKEY);

peer.on('open', id => { mypeerid = id; });
```


### use data channel

```javascript
const conn = peer.connect(PEERID_OF_SSG, {serialization: "none", reliable: true});
conn.on('open', () => { conn.send('hello'); });
```

### upstream client side media

```javascript
navigator.mediaDevices.getUserMedia({audio: true, video: false})
  .then(stream => { peer.call(PEERID_OF_SSG, stream) });
```

## get downstream of media from Janus Gateway

```javascript
// we assume datachannel already establlished.

// set handler for Janus side media stream.
peer.on('call', stream => { $("#video").attr("src", window.URL.createObjectURL(stream) });

// request call
conn.send(`SSG:stream/start,${mypeerid}`)
...

// stop call
conn.send('SSG:stream/stop');
```

For more detail, check [example app](https://github.com/eastandwest/signalinggateway/blob/master/views/examples/index.ejs) and [provisioning script of SSG](https://github.com/eastandwest/signalinggateway-vagrant).


# how to set SSG's peerid

You have two way.

* set it in conf/skyway.json
* set PEERID env while running process

```bash
$ PEERID=ssgid node app.js
```

way of setting env will overwrite setting of skyway.json

# enable automatic execution of streaming process (alpha feature)

You can automatically execute streaming process. To enable this feature, set ENABLE_AUTO_STREAMING=true while starting process as shown below.

```bash
$ ENABLE_AUTO_STREAMING=true node app.js
```

Also, you need to set the path of streaming process in janus.json.

```janus.json
{
 ...
 "streaming_process": "/bin/bash /home/ubuntu/signalinggateway/skywayiot-sdk-test/media_streaming_transfer_test.sh"
}
```

# force OPUS

By setting FORCE_OPUS=true while starting process, you can force audio codec to opus from client to Janus Gateway.

```bash
$ FORCE_OPUS=true node app
```

# how to setup TURN

Since Janus gateway supports [draft spec of turn-rest-api](https://tools.ietf.org/html/draft-uberti-rtcweb-turn-rest-00), you need to setup turn-rest-api server [WIP] and turn server (for instance [coturn](https://github.com/coturn/coturn)). For more detail, [WIP]


# Testing

## run unit test

```bash
$ npm test
```

### watch

```bash
$ npm run test:watch
```

---
license Apache-2.0
