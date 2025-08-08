"use strict";

/**
* @module library.node.audio
* @interface AudioClipProtocol
*/

(class AudioClipProtocol extends Protocol {

    /**
    * @description Plays the audio clip.
    * @category Playback
    */
    play () {
    }

    /**
    * @description Adds a delegate to the audio clip.
    * @param {Object} audioClipDelegate - The audio clip delegate to add.
    * @category Delegation
    */
    addDelegate(audioClipDelegate) {
    }

    /**
    * @description Removes a delegate from the audio clip.
    * @param {Object} audioClipDelegate - The audio clip delegate to remove.
    * @category Delegation
    */
    removeDelegate(audioClipDelegate) {
    }

    /**
    * @description Stops the audio clip.
    * @category Playback
    */
    stop() {
    }


}.initThisClass());