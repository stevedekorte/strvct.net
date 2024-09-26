"use strict";

/**
 * @module library.services.SpeechToText.SttMessages
 */

/**
 * @class SttMessages
 * @extends BMSummaryNode
 * @classdesc Represents a collection of speech-to-text messages.
 */
(class SttMessages extends BMSummaryNode {
  /**
   * @description Initializes the prototype slots for the SttMessages class.
   */
  initPrototypeSlots() {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes for this node.
     */
    this.setSubnodeClasses([SttMessage]);

    /**
     * @member {string} title - The title of the node.
     */
    this.setTitle("log");

    /**
     * @member {boolean} shouldStore - Indicates whether the node should be stored.
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether subnodes should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether new subnodes can be added.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether subnodes can be reordered.
     */
    this.setNodeCanReorderSubnodes(true);

    /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note should display the subnode count.
     */
    this.setNoteIsSubnodeCount(true);
  }

  /*
  service () {
    return this.parentNode()
  }
  */

}.initThisClass());