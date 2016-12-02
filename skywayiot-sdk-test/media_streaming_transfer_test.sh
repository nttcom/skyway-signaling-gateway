#!/bin/sh

# kill child processes, when SIGTERM or SIGINT catched
trap 'kill $(jobs -p)' EXIT

# execute gstreamer
gst-launch-1.0 \
  audiotestsrc ! \
  audioresample ! audio/x-raw,channels=1,rate=16000 ! \
  opusenc bitrate=20000 ! \
    rtpopuspay ! udpsink host=127.0.0.1 port=5002 \
  videotestsrc ! \
  video/x-raw,width=320,height=240,framerate=15/1 ! \
  videoscale ! videorate ! videoconvert ! timeoverlay ! \
  vp8enc ! \
    rtpvp8pay ! udpsink host=127.0.0.1 port=5004
