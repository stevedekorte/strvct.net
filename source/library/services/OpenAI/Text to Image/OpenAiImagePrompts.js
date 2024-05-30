"use strict";

/* 
    OpenAiImagePrompts

*/

(class OpenAiImagePrompts extends BMSummaryNode {
  initPrototypeSlots () {

  }

  init () {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiImagePrompt]);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit () {
    super.finalInit();
    this.setTitle("Text to Image");
    this.setNoteIsSubnodeCount(true);
  }

  service () {
    return this.parentNode();
  }

}.initThisClass());
