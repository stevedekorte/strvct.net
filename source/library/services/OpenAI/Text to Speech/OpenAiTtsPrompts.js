"use strict";

/* 
    OpenAiTtsPrompts

*/

(class OpenAiTtsPrompts extends BMSummaryNode {
  initPrototypeSlots () {

  }

  init () {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiTtsPrompt])
    this.setCanAdd(true)
    this.setNodeCanReorderSubnodes(true)
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Text to Speech");
  }

  service () {
    return this.parentNode()
  }

}.initThisClass());
