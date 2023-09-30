"use strict";

/* 
    SpeechToTextSessions

*/

(class SpeechToTextSessions extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("Web STT");
    this.setSubtitle("speech-to-text service");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([SpeechToTextSession]);
    this.addNodeAction("add");
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(false);

    this.setTitle("Web STT");
    this.setSubtitle("speech-to-text service");
  }

  /*
  service () {
    return this.parentNode()
  }
  */

}.initThisClass());
