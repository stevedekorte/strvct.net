"use strict";

/**
 * @module library.node.audio
 * @class SvAudioClipDelegateProtocol
 * @extends Protocol
 * @classdesc Delegate protocol for receiving audio clip lifecycle events.
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
