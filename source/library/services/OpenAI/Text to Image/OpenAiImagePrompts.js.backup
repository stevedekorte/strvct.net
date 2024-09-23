"use strict";

/* 
    OpenAiImagePrompts

*/

(class OpenAiImagePrompts extends BMSummaryNode {
  
  initPrototypeSlots () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiImagePrompt]);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setTitle("Text to Image");
    this.setNoteIsSubnodeCount(true);
  }

  service () {
    return this.parentNode();
  }

}.initThisClass());
