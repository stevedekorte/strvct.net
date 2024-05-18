"use strict";

/* 
    SpeechToTextSessions

*/

(class SpeechToTextSessions extends BMSummaryNode {
  initPrototypeSlots() {
    this.setSubnodeClasses([SpeechToTextSession]);
  }

  init() {
    super.init();
    this.setSubtitle("speech-to-text service");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(false);

    this.setTitle("Web Speech to Text");
    this.setSubtitle("speech-to-text service");
  }

  /*
  service () {
    return this.parentNode()
  }
  */

}.initThisClass());
