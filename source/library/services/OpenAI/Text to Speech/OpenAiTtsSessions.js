"use strict";

/**
 * @module library.services.OpenAI.Text_to_Speech
 */

/**
 * @class OpenAiTtsSessions
 * @extends BMSummaryNode
 * @classdesc Manages Text to Speech Sessions for OpenAI service.
 */
(class OpenAiTtsSessions extends BMSummaryNode {
  
  /**
   * Initializes the prototype slots for the OpenAiTtsSessions class.

   * @description Sets up the subnodes, storage preferences, and other properties for the class.
   */
  initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes that can be added to this node.
     */
    this.setSubnodeClasses([OpenAiTtsSession]);

    /**
     * @member {boolean} shouldStore - Indicates whether this node should be stored.
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether subnodes should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether new subnodes can be added to this node.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether subnodes can be reordered.
     */
    this.setNodeCanReorderSubnodes(true);

    /**
     * @member {string} title - The title of this node.
     */
    this.setTitle("Text to Speech Sessions");

    /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note should display the subnode count.
     */
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * Retrieves the parent service node.

   * @description Returns the parent node, which is expected to be the service.
   * @returns {Object} The parent node representing the service.
   */
  service () {
    return this.parentNode();
  }

}.initThisClass());