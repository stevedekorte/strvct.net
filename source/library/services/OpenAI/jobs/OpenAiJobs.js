"use strict";

/* 
    OpenAiJobs

*/

(class OpenAiJobs extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("Jobs");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([OpenAiJob])
    //this.setCanAdd(true)
    this.setNodeCanReorderSubnodes(true)
  }

  /*
  finalInit() {
    super.finalInit()
  }

  didInit () {
    super.didInit()
  }
  */

  service () {
    return this.parentNode()
  }

}.initThisClass());
