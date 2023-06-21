"use strict";

/* 

    ArrayView

*/

(class ArrayView extends JsonView {
  /*
  initPrototypeSlots() {
  }

  init() {
    super.init();
  }

  initElement() {
    super.initElement();
    return this;
  }
  */

  setupSubviews() {
    this.removeAllSubviews();
    const array = this.json();
    if (array) {
      array.forEach((v) => {
        const view = this.newViewForValue(v);
        this.addSubview(view);
      });
    }
  }

  toJson () {
    return this.subviews().map(sv => sv.toJson());
  }

}).initThisClass();
