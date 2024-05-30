"use strict";

/* 
    SpeechToTextSessions

*/

(class SpeechToTextSessions extends BMSummaryNode {
  
  initPrototypeSlots() {
    this.setSubnodeClasses([SpeechToTextSession]);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setNoteIsSubnodeCount(false);
    this.setTitle("Web Speech to Text");
    this.setSubtitle("speech-to-text service");
  }

}.initThisClass());
