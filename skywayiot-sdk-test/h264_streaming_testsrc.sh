#!/bin/sh

# this script is for streaming out the h264 media from test source

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
# when ENABLE_AUTO_STREAMING=true, it should be uncommented
# trap 'pkill raspivid; pkill gst-launch-1.0' EXIT

# videotestsrc | rpicamsrc
# audiotestsrc ! \

# start streaming
gst-launch-1.0 videotestsrc ! \
  video/x-raw,width=640,height=480,framerate=30/1 ! \
  videoscale ! videorate ! videoconvert ! timeoverlay ! \
  omxh264enc target-bitrate=2000000 control-rate=variable ! \
  h264parse ! rtph264pay config-interval=1 pt=96 ! \
    udpsink host=127.0.0.1 port=5004 \
audiotestsrc ! \
  audioconvert ! queue ! \
  audio/x-raw,channels=1,rate=16000 ! \
  opusenc bitrate=20000 ! \
    rtpopuspay ! udpsink host=127.0.0.1 port=5002
