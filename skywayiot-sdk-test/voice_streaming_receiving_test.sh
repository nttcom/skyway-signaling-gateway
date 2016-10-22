#!/bin/sh

gst-launch-1.0 -v udpsrc port=25000 \
  caps="application/x-rtp,media=(string)audio,clock-rate=(int)48000,encoding-name=(string)X-GST-OPUS-DRAFT-SPITTKA-00 " ! \
  rtpopusdepay ! opusdec ! wavenc !  \
    filesink location=recorded_audio.wav
