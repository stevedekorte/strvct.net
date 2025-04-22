"use strict";

/*
* @module library.services.AiServiceKit.Tools.Calls
* @class ToolResults
* @extends BMSummaryNode
* @classdesc A collection of ToolResult instances.
*/

(class ToolResults extends BMSummaryNode {
  /*
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.newSlot("assistantToolKit", null);
      slot.setSlotType("AssistantToolKit");
      slot.setAllowsNullValue(true);
      slot.setShouldStoreSlot(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([ToolResult]);
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    this.setNodeCanReorderSubnodes(false);
    this.setCanDelete(false);

    /*
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    */
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit();
    this.setTitle("Assistant tool call result instances");
  }



  toolResultWithId (resultId) {
    return this.subnodes().find((subnode) => subnode.callId() === callId);
  }

}.initThisClass());