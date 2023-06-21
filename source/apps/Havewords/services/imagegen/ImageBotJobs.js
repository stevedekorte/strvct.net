"use strict";

/* 
    ImageBotJobs.js

*/

(class ImageBotJobs extends Jobs {
  initPrototypeSlots() {
    this.newSlot("imageGen", null);
  }

  init () {
    super.init();
    this.setJobClass(ImageBotJob);
    return this;
  }

}).initThisClass();
