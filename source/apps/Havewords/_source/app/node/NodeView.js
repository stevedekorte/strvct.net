"use strict";

/* 
    NodeView

    View that supports protocol to sync to a model object (subclasses of Node).

*/

(class View extends Base {
  initPrototypeSlots() {
    this.newSlot("node", null);
  }

  init() {
    super.init();
    this.setIsDebugging(false);
  }


}).initThisClass();
