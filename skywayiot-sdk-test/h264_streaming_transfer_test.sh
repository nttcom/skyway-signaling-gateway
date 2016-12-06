#!/bin/sh

# this script is for streaming out the h264 from raspicam
# please be sure that to set 'Enable Camera' on raspi-config
# before running this gstreamer1.0 script

# sample configuration on janus.plugin.streaming.sample
# ... please don't forget to comment out of [gstreamer-sample] conf with semi-collon
#
# [gst-rpwc]
# type = rtp
# id = 1
# description = RPWC H264 test streaming
# audio = yes
# video = yes
# audioport = 5002
# audiopt = 111
# audiortpmap = opus/48000/2
# videoport = 5004
# videopt = 96
# videortpmap = H264/90000
# videofmtp = profile-level-id=42e028\;packetization-mode=1

# kill child processes, when SIGTERM or SIGINT catched
trap 'pkill raspivid; pkill gst-launch-1.0' EXIT

# execute gstreamer with raspicam
raspivid --verbose --nopreview -hf -vf \
  --width 640 --height 480 --intra 5 --framerate 15 --bitrate 2000000 \
  --profile baseline --timeout 0 -o - | \
  gst-launch-1.0 fdsrc ! \
    h264parse ! rtph264pay config-interval=1 pt=96 ! \
      udpsink host=127.0.0.1 port=5004 \
    audiotestsrc ! \
    audioresample ! audio/x-raw,channels=1,rate=16000 ! \
    opusenc bitrate=20000 ! \
      rtpopuspay ! udpsink host=127.0.0.1 port=5002

