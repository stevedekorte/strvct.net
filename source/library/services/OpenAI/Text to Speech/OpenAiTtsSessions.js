"use strict";

/* 
    OpenAiTtsSessions

*/

(class OpenAiTtsSessions extends BMSummaryNode {
  initPrototypeSlots () {

  }

  init () {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiTtsSession])
    this.setCanAdd(true)
    this.setNodeCanReorderSubnodes(true)
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Text to Speech Sessions");
    this.setNoteIsSubnodeCount(true);
  }

  service () {
    return this.parentNode()
  }

}.initThisClass());
