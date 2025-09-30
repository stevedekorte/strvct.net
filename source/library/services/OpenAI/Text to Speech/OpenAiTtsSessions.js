"use strict";

/**
 * @module library.services.OpenAI.Text_to_Speech
 * @class OpenAiTtsSessions
 * @extends SvSummaryNode
 * @classdesc Manages Text to Speech Sessions for OpenAI service.
 */

(class OpenAiTtsSessions extends SvSummaryNode {

    /**
   * Initializes the prototype slots for the OpenAiTtsSessions class.
   * @description Sets up the subnodes, storage preferences, and other properties for the class.
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes that can be added to this node.
     * @category Configuration
     */
        this.setSubnodeClasses([OpenAiTtsSession]);

        /**
     * @member {boolean} shouldStore - Indicates whether this node should be stored.
     * @category Storage
     */
        this.setShouldStore(true);

        /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether subnodes should be stored.
     * @category Storage
     */
        this.setShouldStoreSubnodes(true);

        /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether new subnodes can be added to this node.
     * @category Node Management
     */
        this.setNodeCanAddSubnode(true);

        /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether subnodes can be reordered.
     * @category Node Management
     */
        this.setNodeCanReorderSubnodes(true);

        /**
     * @member {string} title - The title of this node.
     * @category Display
     */
        this.setTitle("Text to Speech Sessions");

        /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note should display the subnode count.
     * @category Display
     */
        this.setNoteIsSubnodeCount(true);
    }

    /**
   * Retrieves the parent service node.
   * @description Returns the parent node, which is expected to be the service.
   * @returns {Object} The parent node representing the service.
   * @category Node Management
   */
    service () {
        return this.parentNode();
    }

}.initThisClass());
