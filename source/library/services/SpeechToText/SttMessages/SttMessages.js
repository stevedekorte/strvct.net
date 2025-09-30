"use strict";

/**
 * @module library.services.SpeechToText.SttMessages
 */

/**
 * @class SttMessages
 * @extends SvSummaryNode
 * @classdesc Represents a collection of speech-to-text messages.
 */
(class SttMessages extends SvSummaryNode {
  /**
   * @description Initializes the prototype slots for the SttMessages class.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes for this node.
     * @category Configuration
     */
    this.setSubnodeClasses([SttMessage]);

    /**
     * @member {string} title - The title of the node.
     * @category Configuration
     */
    this.setTitle("log");

    /**
     * @member {boolean} shouldStore - Indicates whether the node should be stored.
     * @category Storage
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether subnodes should be stored.
     * @category Storage
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether new subnodes can be added.
     * @category Node Management
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether subnodes can be reordered.
     * @category Node Management
     */
    this.setNodeCanReorderSubnodes(true);

    /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note should display the subnode count.
     * @category Display
     */
    this.setNoteIsSubnodeCount(true);
  }

  /*
  service () {
    return this.parentNode()
  }
  */

}.initThisClass());