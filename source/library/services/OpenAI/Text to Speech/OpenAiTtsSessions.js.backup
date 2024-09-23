"use strict";

/* 
    OpenAiTtsSessions

*/

(class OpenAiTtsSessions extends BMSummaryNode {
  
  initPrototypeSlots () {
    this.setSubnodeClasses([OpenAiTtsSession]);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setTitle("Text to Speech Sessions");
    this.setNoteIsSubnodeCount(true);
  }

  service () {
    return this.parentNode();
  }

}.initThisClass());
