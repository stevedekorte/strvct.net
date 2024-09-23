"use strict";

/* 
    HomeAssistantFolder

*/

(class HomeAssistantFolder extends BMSummaryNode {
  initPrototypeSlots () {
    this.setTitle("folder");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanReorderSubnodes(true);
    this.setSubnodeClasses([HomeAssistantFolder]);
    this.setNoteIsSubnodeCount(true);
    this.setNodeCanEditTitle(true);
    this.setNodeCanEditSubtitle(true);
    this.setNodeCanAddSubnode(true);
  }

  finalInit () {
    super.finalInit();
    this.makeSortSubnodesByTitle();
  }

  /*
  setupSubnodeClasses () {
    const classes = []; 
    //HomeAssistantObject.subclasses().shallowCopy();
    classes.push(HomeAssistantFolder);
    this.setSubnodeClasses(classes);
  }
  */

}.initThisClass());
