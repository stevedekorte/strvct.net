"use strict";

/* 
    
    HomeAssistants

*/

(class HomeAssistants extends BMSummaryNode {

  initPrototypeSlots() {
    this.setSubnodeClasses([HomeAssistant]);
    this.setTitle("Home Assistants");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
  }

}.initThisClass());
