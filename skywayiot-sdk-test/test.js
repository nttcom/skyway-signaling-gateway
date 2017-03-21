#!/usr/bin/node

const exec = require('child_process').exec;

let counter = 0;

const execStreaming = () => {
  exec( 'bash ' + __dirname + '/h264_streaming_usbcan.sh', (err, stdout, stderr) => {
//  exec( 'bash ' + __dirname + '/test.sh', (err, stdout, stderr) => {
    if(err) {
      console.error(err)
      counter++
      if(counter < 5) setTimeout(execStreaming, 1000);
    }
  });
}

execStreaming();
