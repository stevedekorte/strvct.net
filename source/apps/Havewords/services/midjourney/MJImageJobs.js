"use strict";

/* 
    MJImageJobs

*/

(class MJImageJobs extends Jobs {
  initPrototypeSlots() {

    this.setShouldStore(true)
    this.setShouldStoreSubnodes(true)
  }

  init () {
    super.init();
    this.addAction("add")
    this.setJobClass(MJImageJob)
    return this;
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Jobs")
    this.setSubnodeClasses([MJImageJob])
    this.setNodeCanReorderSubnodes(true)
  }

  service () {
    return this.parentNode()
  }

}.initThisClass());

