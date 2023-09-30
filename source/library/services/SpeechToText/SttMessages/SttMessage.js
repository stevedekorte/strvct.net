"use strict";

/* 

    SttMessage

*/

(class SttMessage extends BMSummaryNode {
  initPrototypeSlots() {

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

  init() {
    super.init();
    this.setSubtitle("")
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    //this.setSubnodeClasses([SttMessage]);
    this.setNodeCanReorderSubnodes(false);
    this.setIsDebugging(true)
  }

  title () {
    return this.result()
  }

  finalInit() {
    super.finalInit()
  }

}.initThisClass());
