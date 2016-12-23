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

## iOS

### initialize peer

```objective-c
SKWPeer* peer;
SKWPeerOption* option = [[SKWPeerOption alloc] init];
option.key = kAPIkey;
option.domain = kDomain;
    
peer	= [[SKWPeer alloc] initWithId:nil options:option];

[peer on:SKW_PEER_EVENT_OPEN callback:^(NSObject* obj)
  {
    NSString *mypeerid = (NSString *)obj;
  }];
```

### use data channel

```objective-c
SKWConnectOption* option = [[SKWConnectOption alloc] init];
option.serialization = SKW_SERIALIZATION_NONE;
option.reliable = YES;
    
SKWDataConnection *dataConnection = [_peer connectWithId:strSSGPEERID options:option];

[data on:SKW_DATACONNECTION_EVENT_OPEN callback:^(NSObject* obj)
  {
    [_dataConnection send:@"hello"];
  }];
```

### upstream client side media

```objective-c
SKWMediaConstraints* constraints = [[SKWMediaConstraints alloc] init];
constraints.videoFlag = NO;
constraints.audioFlag = YES;
    
SKWMediaStream* msLocal = [SKWNavigator getUserMedia:constraints];
    
SKWMediaConnection* mediaAudioConnection = [_peer callWithId:remoteId stream:_msLocal];
```

## get downstream of media from Janus Gateway

```objective-c
// we assume datachannel already establlished.

// set handler for Janus side media stream.
peer.on('call', stream => { $("#video").attr("src", window.URL.createObjectURL(stream) });

[media on:SKW_MEDIACONNECTION_EVENT_STREAM callback:^(NSObject* obj)
  {
    SKWMediaStream* stream = (SKWMediaStream *)obj;
  }];


// request call
NSMutableString *message = [NSMutableString stringWithString: @"SSG:stream/start,"];
[message appendString: mypeerid];
         
[dataConnection send:message];
...

// stop call
[dataConnection send:@"SSG:stream/stop"];
```

## Android

### initialize peer

```java
Context context = getApplicationContext();
PeerOption options = new PeerOption();

//Enter your API Key.
options.key = YOURAPIKEY;
//Enter your registered Domain.
options.domain = YOURAPIDOMAIN;

Peer peer = new Peer(context, options);

peer.on(Peer.PeerEventEnum.OPEN, new OnCallback() {
  @Override
	public void onCallback(Object object) {
    String mypeerid = (String) object;
  }
});
```

### use data channel

```java
ConnectOption option = new ConnectOption();
option.serialization = DataConnection.SerializationEnum.NONE;

DataConnection dataconn = peer.connect(strSSGPEERID, option);

dataconn.on(DataConnection.DataEventEnum.OPEN, new OnCallback() {
	@Override
	public void onCallback(Object object) {
    dataconn.send("hello");
  }
});
```

### upstream client side media

```java
Navigator.initialize(_peer);
MediaConstraints constraints = new MediaConstraints();
constraints.videoFlag = false;
constraints.audioFlag = true;
MediaStream msLocal = Navigator.getUserMedia(constraints);

MediaConnection mediaconnAudio = peer.call(strSSGPEERID, msLocal);
```

## get downstream of media from Janus Gateway

```java
// we assume datachannel already establlished.

// set handler for Janus side media stream.
media.on(MediaConnection.MediaEventEnum.STREAM, new OnCallback() {
	@Override
	public void onCallback(Object object)	{
		MediaStream msRemote = (MediaStream) object;
  }
}

// request call
String mesg = "SSG:stream/start," + mypeerid;
dataconn.send(str);

...

// stop call
dataconn.send("SSG:stream/stop");
```

For more detail about iOS and Android, check [example app](https://github.com/eastandwest/iOS-Android-Client-for-IoT).


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
license MIT
