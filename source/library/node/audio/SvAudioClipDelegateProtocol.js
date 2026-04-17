"use strict";

/**
  * @module library.node.audio
  * @interface SvAudioClipDelegateProtocol
*/

(class SvAudioClipDelegateProtocol extends Protocol {

    /**
      * @description Called when the audio clip ends.
      * @param {SvAudioClipProtocol} audioClip - The sound.
      * @category Audio Event Handling
    */

    onSoundEnded (audioClip) {
    }

}.initThisClass());
