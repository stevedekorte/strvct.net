/**
 * @module library.services.HomeAssistant.Assistants.HomeAssistants
 */

"use strict";

/**
 * @class HomeAssistants
 * @extends BMSummaryNode
 * @classdesc Represents a collection of home assistants for home automation.
 */
(class HomeAssistants extends BMSummaryNode {
  
  /**
   * @description Initializes the prototype slots for the HomeAssistants class.
   * @method
   */
  initPrototypeSlots () {
    /**
     * @property {string} title - The title of the home assistants collection.
     */
    this.setTitle("Home Assistants");

    /**
     * @property {boolean} noteIsSubnodeCount - Indicates if the note should display the subnode count.
     */
    this.setNoteIsSubnodeCount(true);

    /**
     * @property {string} subtitle - The subtitle of the home assistants collection.
     */
    this.setSubtitle("home automation");

    /**
     * @property {boolean} shouldStore - Indicates if the home assistants collection should be stored.
     */
    this.setShouldStore(true);

    /**
     * @property {boolean} shouldStoreSubnodes - Indicates if the subnodes of the home assistants collection should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @property {Array} subnodeClasses - The classes allowed as subnodes of the home assistants collection.
     */
    this.setSubnodeClasses([HomeAssistant]);

    /**
     * @property {boolean} nodeCanAddSubnode - Indicates if subnodes can be added to the home assistants collection.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @property {boolean} nodeCanReorderSubnodes - Indicates if subnodes can be reordered in the home assistants collection.
     */
    this.setNodeCanReorderSubnodes(true);
  }

}.initThisClass());