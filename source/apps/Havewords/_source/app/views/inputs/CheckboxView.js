"use strict";

/* 
    CheckboxView

*/

(class CheckboxView extends View {
  init () {
    super.init();
    this.setTagName("input");
  }

  initElement () {
    super.initElement();
    this.element().type = "checkbox";
    this.setClassName("CheckboxView");
  }

  setIsChecked(isChecked) {
    this.element().checked = isChecked
    return this;
  }

  isChecked() {
    return this.element().checked;
  }


}.initThisClass());
