"use strict";

/* 
    HomeAssistants

*/

(class HomeAssistants extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("Home Assistants");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([HomeAssistant]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
  }

  /*
  didInit () {
    super.didInit()
  }
  */

  /*
  service () {
    return this.parentNode()
  }
  */

}.initThisClass());
