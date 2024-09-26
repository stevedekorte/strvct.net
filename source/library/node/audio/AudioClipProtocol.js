"use strict";

/**
 * @module library.node.audio
 * @interface AudioClipProtocol
*/

(class AudioClipProtocol extends Protocol {

  /**
   * @description Plays the audio clip.
   */
  play () {
  }

  /**
   * @description Adds a delegate to the audio clip.
   * @param {Object} audioClipDelegate - The audio clip delegate to add.
   */
  addDelegate(audioClipDelegate) {
  }

  /**
   * @description Removes a delegate from the audio clip.
   * @param {Object} audioClipDelegate - The audio clip delegate to remove.
   */
  removeDelegate(audioClipDelegate) {
  }

  /**
   * @description Stops the audio clip.
   */
  stop() {
  }


}.initThisClass());