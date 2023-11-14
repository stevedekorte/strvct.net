"use strict";

/* 
    OpenAiImages

*/

(class OpenAiImages extends BMSummaryNode {

  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("image results");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiImage]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(false);
    this.setNoteIsSubnodeCount(true);
  }

  imagePrompt () {
    return this.parentNode()
  }

}.initThisClass());
