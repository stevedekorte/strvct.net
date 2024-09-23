"use strict";

/**
 * @module library.services.Azure.locales
 */

/**
 * @class AzureLocale
 * @extends BMSummaryNode
 * @classdesc Represents an Azure Locale node in the application.
 */
(class AzureLocale extends BMSummaryNode {
  /**
   * @description Initializes the prototype slots for the AzureLocale class.
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the prototype for the AzureLocale class.
   */
  initPrototype () {
    this.setNodeSubtitleIsChildrenSummary(true)
    this.setShouldStoreSubnodes(false)
    this.setCanDelete(false)
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * @description Initializes a new instance of the AzureLocale class.
   */
  init () {
    super.init();
    this.setSubtitle("Azure Locale");
  }

  /**
   * @description Adds a voice to the Azure Locale.
   * @param {Object} aVoice - The voice to be added.
   * @returns {AzureLocale} - The current instance of AzureLocale.
   */
  addVoice (aVoice) {
    this.addSubnode(aVoice.duplicate())
    return this
  }

}.initThisClass());