"use strict";

/* 
    AzureLocale

*/

(class AzureLocale extends BMSummaryNode {
  initPrototypeSlots () {
  }

  initPrototype () {
    this.setNodeSubtitleIsChildrenSummary(true)
    this.setShouldStoreSubnodes(false)
    this.setCanDelete(false)
    this.setNoteIsSubnodeCount(true);
  }

  init () {
    super.init();
    this.setSubtitle("Azure Locale");
  }

  addVoice (aVoice) {
    this.addSubnode(aVoice.duplicate())
    return this
  }

}.initThisClass());

