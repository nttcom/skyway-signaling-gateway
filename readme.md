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
$ cp conf/janus.json.tmpl conf/janus.json
$ cp conf/skyway.json.tmpl conf/skyway.json
```

You need to change skyway.json. At least, you have to replace api key setting, in case you set __http://example.com__ as a origin of it.
In many cases, you don't need to change janus.json

# run SSG

```bash
$ node app
```

# snipet for web apps (how to talk with Janus Gateway)

Snipet below use [SkyWay SDK](http://nttcom.github.io/skyway/en/index.html)

## initialize peer

```javascript
const mypeerid;
const peer = new Peer(key: MY_APIKEY);

peer.on('open', id => { mypeerid = id; });
```


## use data channel

```javascript
const conn = peer.connect(PEERID_OF_SSG, {serialization: "none", reliable: true});
conn.on('open', () => { conn.send('hello'); });
```

## transfer client side media stream

```javascript
navigator.mediaDevices.getUserMedia({audio: true, video: false})
  .then(stream => { peer.call(PEERID_OF_SSG, stream) });
```

## get media stream from Janus Gateway

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

# how to modify SSG's peerid

You have two way.

* set it in conf/skyway.json
* set PEERID env while running process

```bash
$ PEERID=ssgid node app.js
```

way of setting env will overwrite setting of skyway.json

## how to setup TURN?

Since Janus gateway supports [turn rest api draft](https://tools.ietf.org/html/draft-uberti-rtcweb-turn-rest-00), you need to setup turn-rest-api server and turn server (for instance [coturn](https://github.com/coturn/coturn)). For more detail, [WIP]


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
license MIT
