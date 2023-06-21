"use strict";

/* 

    NumberView

*/

(class NumberView extends TextFieldView {

  init () {
    super.init();
    this.setValidationFunc((n) => {
      const isNumber = !isNaN(parseFloat(n)) && !isNaN(n - 0);
      return isNumber;
    });
  }

  initElement() {
    super.initElement();
    const s = this.element().style;
    s.display = "inline-block";
    s.margin = "0em";
    s.padding = "0em";
    this.setMinMaxWidth("2em");
  }

  useEditableStyle () {
    this.style().border = "none";
    this.style().borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
    this.style().borderRadius = "0px";
    return this;
  }

  toJson () {
    return Number(this.value());
  }

}).initThisClass();
