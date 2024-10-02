"use strict";

/**
 * @module library.services.Azure.speakers
 */

/**
 * @class AzureSpeakers
 * @extends BMSummaryNode
 * @classdesc Represents a collection of Azure Speakers.
 */
(class AzureSpeakers extends BMSummaryNode {
  /**
   * @description Initializes the prototype slots for the AzureSpeakers class.
   * @category Initialization
   */
  initPrototypeSlots () {
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(true)
  }

  /**
   * @description Initializes the AzureSpeakers instance.
   * @returns {AzureSpeakers} The initialized instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setNodeCanAddSubnode(true)
    return this;
  }

  /**
   * @description Performs final initialization for the AzureSpeakers instance.
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setTitle("Speakers")
    this.setSubnodeClasses([AzureSpeaker])
    this.setNodeCanReorderSubnodes(true)
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * @description Gets the parent service node.
   * @returns {Object} The parent service node.
   * @category Hierarchy
   */
  service () {
    return this.parentNode()
  }

}.initThisClass());