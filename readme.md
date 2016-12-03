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

We support three feature between client and Janus Gateway.

1. bidirectional data channel communication
  - 3rd party interface for this is TCP (by default 15001)
2. one-way media stream from Janus Gateway
3. one-way voice stream to Janus Gateway
  - 3rd party interface for this is UDP (by default 25000)

Below, you can check the Snipets leveraging [SkyWay SDK](http://nttcom.github.io/skyway/en/index.html) for above features. 

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

# how to set SSG's peerid

You have two way.

* set it in conf/skyway.json
* set PEERID env while running process

```bash
$ PEERID=ssgid node app.js
```

way of setting env will overwrite setting of skyway.json

# disable automatic execution of streaming process

By default, streaming process configured in janus.json (streaming_process property) will be automatically executed.

```janus.json
{
 ...
 "streaming_process": "/bin/bash /home/ubuntu/signalinggateway/skywayiot-sdk-test/media_streaming_transfer_test.sh"
}
```

If you want to disable this feature, set DISABLE_AUTO_STREAMING=true while starting process.

```bash
$ DISABLE_AUTO_STREAMING=true node app.js
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
license MIT
