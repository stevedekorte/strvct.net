"use strict";

/* 
    OpenAiImagePrompts

*/

(class OpenAiImagePrompts extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("Image Prompts");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiImagePrompt])
    this.setCanAdd(true)
    this.setNodeCanReorderSubnodes(true)
  }

  finalInit() {
    super.finalInit()
    this.setTitle("Image Prompts");
  }

  service () {
    return this.parentNode()
  }

}.initThisClass());
