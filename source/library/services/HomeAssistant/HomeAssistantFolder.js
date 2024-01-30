"use strict";

/* 
    HomeAssistantFolder

*/

(class HomeAssistantFolder extends BMSummaryNode {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("folder");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
    this.setSubnodeClasses([HomeAssistantFolder]);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
    this.makeSortSubnodesByTitle();
    this.setNodeCanEditTitle(true);
    this.setNodeCanEditSubtitle(true);
    //this.setupSubnodeClasses();
  }

  /*
  setupSubnodeClasses () {
    const classes = []; 
    //HomeAssistantObject.subclasses().shallowCopy();
    classes.push(HomeAssistantFolder);
    this.setSubnodeClasses(classes);
  }
  */

  /*
  didInit () {
    super.didInit()
  }
  */


}.initThisClass());
