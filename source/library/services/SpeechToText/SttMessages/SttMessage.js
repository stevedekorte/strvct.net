"use strict";

/**
 * @module library.services.SpeechToText.SttMessages
 */

/**
 * @class SttMessage
 * @extends BMSummaryNode
 * @classdesc Represents a speech-to-text message.
 */
(class SttMessage extends BMSummaryNode {
  /**
   * @description Initializes the prototype slots for the SttMessage class.
   */
  initPrototypeSlots () {
    /**
     * @property {string} result - The speech-to-text result.
     */
    {
      const slot = this.newSlot("result", "");      
      slot.setInspectorPath("settings")
      slot.setLabel("Don't break on Pauses")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }
  }

  /**
   * @description Initializes the SttMessage instance.
   */
  init() {
    super.init();
    this.setSubtitle("")
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanReorderSubnodes(false);
    this.setIsDebugging(true)
  }

  /**
   * @description Gets the title of the SttMessage.
   * @returns {string} The result of the speech-to-text conversion.
   */
  title () {
    return this.result()
  }

  /**
   * @description Performs final initialization tasks.
   */
  finalInit() {
    super.finalInit()
  }

}.initThisClass());