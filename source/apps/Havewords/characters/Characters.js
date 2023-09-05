"use strict";

/*

    Characters

*/

(class Characters extends BMSummaryNode {
    initPrototypeSlots() {

    }
  
    init() {
      super.init();
      this.setTitle("Characters");
      this.setShouldStore(true);
      this.setShouldStoreSubnodes(true);
      this.setSubnodeClasses([Character]);
      this.addNodeAction("add");
      this.setNodeCanReorderSubnodes(true);
    }
  
    finalInit() {
      super.finalInit()
      this.setNoteIsSubnodeCount(true);
    }
  
  }.initThisClass());
  