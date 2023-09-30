"use strict";

/* 
    Sessions

*/

(class Sessions extends Node {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.addSubnode(Session.shared());
  }

}.initThisClass());
