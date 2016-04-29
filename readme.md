# Signaling Gateway

Signaling Gateway for Skyway and Janus

## how to run

```bash
$ cp conf/skyway.json.tmpl conf/skyway.json
```

change apikey and origin property which are registered in https://skyway.io

```bash
$ node index.js
```

## run unit test (watch)

```bash
$ npm run devtest
```

## run browser test

* run SSG

```bash
$ node index.js
```

* run test script

target : test/integration/ssg.test.js

```bash
$ npm run browsertest
```

* open test site

```bash
$ open https://192.168.33.10:8080/browsertest.build
```

please note that ip address is 192.168.33.10 of test machine.
