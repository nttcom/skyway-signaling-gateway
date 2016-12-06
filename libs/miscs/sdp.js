/**
 * sdp.js
 *
 * modify sdp message to force opus codec etc.
 *
 */

class SDP {
  /**
   * constructor
   *
   */
  constructor(){
  }

  /**
   * If there is audio attributes in offer message, it will force opus codec only.
   * This also normarize any linefeed code to ``\r\n``
   *
   * @params {string} offer_sdp - sdp message of offer
   * @return {string} - modified sdp message of offer
   *
   */
  force_opus(offer_sdp) {
    let ret;

    // split sdp message delimitted by 'm=' then take out audio section
    const audioSections = offer_sdp.split(/m=/).filter(section => {
      return section.indexOf("audio") === 0;
    });

    // when audio section available, force opus to codec and '\r\n' for linefeed.
    if (audioSections && audioSections[0]) {
      // craete new forced audio sections from original section
      const newAudioSections =  audioSections[0].split(/\r\n|\r|\n/).map(line => {
        if (line.match(/^audio.+UDP.+$/)) {
          line = "audio 9 UDP/TLS/RTP/SAVPF 111";
        }
        return line;
      }).filter(line => {
        return (!line.match(/^a=rtpmap.+$/) || line.match("opus"))
      }).join('\r\n');

      // create return sdp by replacing audio section from original one.
      // this also replace linefeed code to \r\n
      ret = offer_sdp.split(/m=/).map(section => {
        if(section.indexOf("audio") === 0) {
          section = newAudioSections;
        };
        return section;
      }).join('m=').split(/\r\n|\r|\n/).join("\r\n");
    } else {
      // when no audio attribute available, only replace linefeed code to \r\n
      ret = offer_sdp.split(/\r\n|\r|\n/).join("\r\n")
    }

    return ret
  }
}

const sdp = new SDP()

module.exports = sdp
