"use strict";

/* 
    OpenAiJob

*/

(class OpenAiJob extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("Jobs");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiJob])
    //this.addNodeAction("add")
    this.setNodeCanReorderSubnodes(true)
  }

  /*
  finalInit() {
    super.finalInit()
  }

  didInit () {
    super.didInit()
  }

  jobs () {
    return this.parentNode()
  }
  */

}.initThisClass());
