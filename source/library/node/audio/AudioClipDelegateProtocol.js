"use strict";

/**
  * @module library.node.audio
  * @interface AudioClipDelegateProtocol
*/

(class AudioClipDelegateProtocol extends Protocol {

    /**
      * @description Called when the audio clip ends.
      * @param {AudioClipProtocol} audioClip - The sound.
      * @category Audio Event Handling
    */

    onSoundEnded (audioClip) {
    }

}.initThisClass());