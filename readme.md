# SSG - Skyway Signaling Gateway

Signaling Gateway for Skyway and Janus Gateway

## How to install and setup

see SkyWay IoT SDK [install manual](https://github.com/nttcom/skyway-iot-sdk/blob/master/docs/how_to_install.md)

(T.B.D) after registered to npm
```
$ npm -g install skyway-signaling-gateway
$ ssg setup
$ ssg start
```

# Supported features

We support three features shown below.

1. bidirectional data channel communication
  - 3rd party interface for this is TCP (by default 15000)
2. one-way media stream from Janus Gateway
  - leveraging streaming plugin of Janus Gateway
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
  .then( stream => { peer.call(PEERID_OF_SSG, stream) } );
```

## get media downstream from Janus Gateway

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

## how to set SSG's peerid

You have two way.

* set it in conf/skyway.yaml
* set PEERID environment while running process

```bash
$ PEERID=ssgid node app.js
```

setting envronment will overwrite it in skyway.yaml

## enable automatic execution of streaming process (alpha feature)

You can automatically execute streaming process. To enable this feature, set ENABLE_AUTO_STREAMING=true while starting process as shown below.

```bash
$ ENABLE_AUTO_STREAMING=true node app.js
```

Also, you need to set the path of streaming process in janus.yaml.

```janus.yaml
streaming_process: "/bin/bash ~/signalinggateway/skywayiot-sdk-test/media_streaming_transfer_test.sh"
```

## force OPUS

By setting FORCE_OPUS=true while starting process, you can force audio codec to opus from client to Janus Gateway.

```bash
$ FORCE_OPUS=true node app
```

## setup apikey, origin, secure and uuid parameters from environment for development purpose

use SSG_APIKEY, SSG_ORIGIN, SSG_SECURE and SSG_UUID for each

```bash
SSG_APIKEY=XXXXXXXX-XXXX-XXXX-XXXXXXXXXXXX SSG_ORIGIN=http://localhost SSG_UUID="test-uuid" node app.js
```

## join room without 3rd party appp

use ROOMNAME env

```bash
ROOMNAME=testroom node app.js
```

## use MQTT interface

use MQTT_TOPIC and MQTT_URL env

when MQTT_TOPIC is omitted, ssg does not provide MQTT interface feature
when MQTT_URL is omitted, it use ``mqtt://localhost``

```bash
ROOMNAME=testroom MQTT_TOPIC=testtopic node app.js
```



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
