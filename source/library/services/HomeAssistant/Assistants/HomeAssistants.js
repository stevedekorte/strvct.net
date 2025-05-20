/**
 * @module library.services.HomeAssistant.Assistants
 */

"use strict";

/**
 * @class HomeAssistants
 * @extends SvSummaryNode
 * @classdesc Represents a collection of home assistants for home automation.
 */
(class HomeAssistants extends SvSummaryNode {
  
  /**
   * @description Initializes the prototype slots for the HomeAssistants class.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {string} title - The title of the home assistants collection.
     * @category Configuration
     */
    this.setTitle("Home Assistants");

    /**
     * @member {boolean} noteIsSubnodeCount - Indicates if the note should display the subnode count.
     * @category Display
     */
    this.setNoteIsSubnodeCount(true);

    /**
     * @member {string} subtitle - The subtitle of the home assistants collection.
     * @category Configuration
     */
    this.setSubtitle("home automation");

    /**
     * @member {boolean} shouldStore - Indicates if the home assistants collection should be stored.
     * @category Data Management
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Indicates if the subnodes of the home assistants collection should be stored.
     * @category Data Management
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {Array} subnodeClasses - The classes allowed as subnodes of the home assistants collection.
     * @category Structure
     */
    this.setSubnodeClasses([HomeAssistant]);

    /**
     * @member {boolean} nodeCanAddSubnode - Indicates if subnodes can be added to the home assistants collection.
     * @category Structure
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates if subnodes can be reordered in the home assistants collection.
     * @category Structure
     */
    this.setNodeCanReorderSubnodes(true);
  }

}.initThisClass());