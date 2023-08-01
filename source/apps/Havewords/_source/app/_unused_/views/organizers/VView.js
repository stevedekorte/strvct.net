"use strict";

/* 
    VView

*/

(class VView extends View {
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
    s.flexDirection = "column";
    s.displayOrientation = "column";
    //s.minWidth = "fit-content"; 
    //s.minHeight = "100%";

    s.minWidth = "100%";
    s.minHeight = "fit-content";
  }

}).initThisClass();
