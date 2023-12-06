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
    this.setSubnodeClasses([OpenAiImagePrompt])
    this.setCanAdd(true)
    this.setNodeCanReorderSubnodes(true)
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Text to Image");
  }

  service () {
    return this.parentNode()
  }

}.initThisClass());
