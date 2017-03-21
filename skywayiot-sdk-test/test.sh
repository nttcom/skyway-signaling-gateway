#!/bin/bash

# DEVICE="alsa_input.usb-C-Media_Electronics_Inc._USB_PnP_Sound_Device-00-Device.analog-mono"
DEVICE="alsa_input.usb-Creative_Technology_Ltd._Live__Cam_Chat_HD_VF0790_2015012618902-02-VF0790.analog-stereo"

gst-launch-1.0 -e -v pulsesrc device="${DEVICE}" ! audioconvert ! alsasink
#gst-launch-1.0 -v alsasrc device=hw:2 ! audioconvert ! alsasink

