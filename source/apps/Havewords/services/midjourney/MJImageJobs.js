"use strict";

/* 
    MJImageJobs

*/

(class MJImageJobs extends Jobs {
  initPrototypeSlots() {
  }

  init () {
    super.init();
    this.setJobClass(MJImageJob);
    return this;
  }

}.initThisClass());

