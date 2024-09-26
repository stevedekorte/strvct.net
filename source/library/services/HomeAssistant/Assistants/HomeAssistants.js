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

   */
  initPrototypeSlots () {
    /**
     * @member {string} title - The title of the home assistants collection.
     */
    this.setTitle("Home Assistants");

    /**
     * @member {boolean} noteIsSubnodeCount - Indicates if the note should display the subnode count.
     */
    this.setNoteIsSubnodeCount(true);

    /**
     * @member {string} subtitle - The subtitle of the home assistants collection.
     */
    this.setSubtitle("home automation");

    /**
     * @member {boolean} shouldStore - Indicates if the home assistants collection should be stored.
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Indicates if the subnodes of the home assistants collection should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {Array} subnodeClasses - The classes allowed as subnodes of the home assistants collection.
     */
    this.setSubnodeClasses([HomeAssistant]);

    /**
     * @member {boolean} nodeCanAddSubnode - Indicates if subnodes can be added to the home assistants collection.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates if subnodes can be reordered in the home assistants collection.
     */
    this.setNodeCanReorderSubnodes(true);
  }

}.initThisClass());