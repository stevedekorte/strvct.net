"use strict";

/* 
    HView

*/

(class HView extends View {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setIsDebugging(false);
    this.create();
  }

  initElement() {
    super.initElement();
    const s = this.style();
    s.display = "flex";
    s.flexDirection = "row";
    s.minWidth = "100%";
    s.minHeight = "fit-content";
  }

}).initThisClass();
