"use strict";

/**
 * @module SpeechToText
 */

/**
 * @class SpeechToTextSessions
 * @extends BMSummaryNode
 * @classdesc Manages sessions for speech-to-text conversion.
 */
(class SpeechToTextSessions extends BMSummaryNode {
  
  /**
   * @description Initializes the prototype slots for the SpeechToTextSessions class.
   * @private
   */
  initPrototypeSlots () {
    /**
     * @property {Array} subnodeClasses - The classes of subnodes.
     */
    this.setSubnodeClasses([SpeechToTextSession]);

    /**
     * @property {boolean} shouldStore - Whether the instance should be stored.
     */
    this.setShouldStore(true);

    /**
     * @property {boolean} shouldStoreSubnodes - Whether subnodes should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @property {boolean} nodeCanAddSubnode - Whether the node can add subnodes.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @property {boolean} nodeCanReorderSubnodes - Whether subnodes can be reordered.
     */
    this.setNodeCanReorderSubnodes(true);

    /**
     * @property {boolean} noteIsSubnodeCount - Whether the note represents the subnode count.
     */
    this.setNoteIsSubnodeCount(false);

    /**
     * @property {string} title - The title of the sessions.
     */
    this.setTitle("Web Speech to Text");

    /**
     * @property {string} subtitle - The subtitle of the sessions.
     */
    this.setSubtitle("speech-to-text service");
  }

}.initThisClass());