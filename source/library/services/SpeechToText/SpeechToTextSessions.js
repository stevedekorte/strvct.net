"use strict";

/**
 * @module library.services.SpeechToText
 */

/**
 * @class SpeechToTextSessions
 * @extends SvSummaryNode
 * @classdesc Manages sessions for speech-to-text conversion.
 */
(class SpeechToTextSessions extends SvSummaryNode {

    /**
   * @description Initializes the prototype slots for the SpeechToTextSessions class.
   * @private
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes.
     * @category Configuration
     */
        this.setSubnodeClasses([SpeechToTextSession]);

        /**
     * @member {boolean} shouldStore - Whether the instance should be stored.
     * @category Storage
     */
        this.setShouldStore(true);

        /**
     * @member {boolean} shouldStoreSubnodes - Whether subnodes should be stored.
     * @category Storage
     */
        this.setShouldStoreSubnodes(true);

        /**
     * @member {boolean} nodeCanAddSubnode - Whether the node can add subnodes.
     * @category Node Management
     */
        this.setNodeCanAddSubnode(true);

        /**
     * @member {boolean} nodeCanReorderSubnodes - Whether subnodes can be reordered.
     * @category Node Management
     */
        this.setNodeCanReorderSubnodes(true);

        /**
     * @member {boolean} noteIsSubnodeCount - Whether the note represents the subnode count.
     * @category Node Management
     */
        this.setNoteIsSubnodeCount(false);

        /**
     * @member {string} title - The title of the sessions.
     * @category Display
     */
        this.setTitle("Web Speech to Text");

        /**
     * @member {string} subtitle - The subtitle of the sessions.
     * @category Display
     */
        this.setSubtitle("speech-to-text service");
    }

}.initThisClass());
