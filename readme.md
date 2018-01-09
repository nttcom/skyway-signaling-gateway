# SSG - Skyway Signaling Gateway

Signaling Gateway for Skyway and Janus Gateway

## How to install and setup

```
$ npm -g install skyway-signaling-gateway
$ ssg setup
# register your API key.
$ ssg start
```

# Supported features

We support three features shown below.

1. bidirectional data channel communication
  - 3rd party interface is TCP (by default 15000)
  - interface for janus skyway plugin is also TCP (by default 14999)
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

(preamble of ``SSG_`` will be added to assigned peerid)

setting envronment will overwrite it in skyway.yaml

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

## set janus parameter with environment

* JANUS_REST_SCHEME
  - ``http`` or ``https``
* JANUS_ENDPOINT_ADDR
  - e.g. ``localhost``
* JANUS_REST_PORT
  - e.g. ``8089``
* JANUS_DATA_PORT
  - e.g. ``14999``

## use MQTT interface

use MQTT_TOPIC and MQTT_URL env

```bash
MQTT_URL=mqtt://localhost MQTT_TOPIC=testtopic node app.js
```

## How to test MQTT

* Install mosquitto

```bash
$ sudo apt-get -y install mosquitto
```

* test with mosquitto_client

Install mosquitto client

```bash
$ sudo apt-get -y install mosquitto-clients
```

publish

```bash
$ mosquitto_pub -m 'test' -t 'testtopic/a'
```

subscribe
```bash
$ mosquitto_sub -t 'testtopic/a'
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
