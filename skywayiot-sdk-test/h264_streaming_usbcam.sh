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
# below needs
#  apt-get update
#  apt-get install gstreamer1.0 gstreamer1.0-tools
#  git clone https://github.com/thaytan/gst-rpicamsrc.git
#  cd gst-rpicamsrc
#  ./autogen.sh --prefix=/usr --libdir=/usr/lib/arm-linux-gnueabihf/
#  make
#  sudo make install

# about gst-rpicamsrc, see more detail at https://github.com/thaytan/gst-rpicamsrc

# autoaudiosrc ! audioconvert ! \
# alsasrc device=hw:1 ! audioconvert ! \
# videotestsrc | rpicamsrc
# audiotestsrc ! \

# to avoid hw:1 as busy, call 'arecord'
# arecord -l
# alsasrc device=hw:1 volume=10 ! \
# alsasrc device=hw:1 ! \
#  volume volume=8 ! \

# start streaming
gst-launch-1.0 v4l2src device=/dev/video0 ! \
  video/x-raw,width=640,height=480,framerate=30/1 ! \
  videoscale ! videorate ! videoconvert ! timeoverlay ! \
  omxh264enc target-bitrate=2000000 control-rate=variable ! \
  h264parse ! rtph264pay config-interval=1 pt=96 ! \
    udpsink host=127.0.0.1 port=5004 \
alsasrc device=hw:1 ! \
  volume volume=10 ! audioconvert ! \
  queue ! audioresample ! \
  audioconvert ! queue ! \
  audio/x-raw,channels=1,rate=16000 ! \
  opusenc bitrate=20000 ! \
    rtpopuspay ! udpsink host=127.0.0.1 port=5002
