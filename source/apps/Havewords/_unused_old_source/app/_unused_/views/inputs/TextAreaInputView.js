"use strict";

/* 
    TextAreaInputView

*/

(class TextAreaInputView extends View {
  initPrototypeSlots () {
    this.newSlot("isEditable", true);
  }

  init () {
    super.init();
    this.setTagName("textarea");
  }

  create () {
    //debugger;
    super.create();
    return this;
  }

  initElement () {
    super.initElement();
    this.style().height = "1.1em";
    this.style().lineHeight = "1.1em";
    this.style().padding = "0em";
    this.style().paddingTop = "0.5em";
    this.style().margin = "0em";
    this.listenForFocus();
    this.listenForBlur();
    return this;
  }


  onFocus (event) {
    this.style().border = "none";
  }


  setIsEditable (aBool) {
    this._isEditable = aBool;
    this.updateDisabled();
    return this;
  }

  useEditableStyle () {
    this.style().borderBottom = "1px solid rgba(255, 255, 255, 0.2)";
    this.style().borderRadius = "0px";
    return this;
  }

  useUneditableStyle () {
    this.style().borderBottom = "none";
    return this;
  }

  updateDisabled() {
    this.element().disabled = !this.isEditable();

    if (this.isEditable()) {
      this.useEditableStyle();
    } else {
      this.useUneditableStyle();
    }

    return this;
  }
  
  initElement () {
    super.initElement();
    this.element().style.textAlign = "left";
    this.listenForKeyDown()
  }

  onEnterKeyDown (event) {
    this.submit();
    event.target.blur();
    event.preventDefault(); // prevent new line
  }
  
  appendText(text) {
    this.element().value += text;
  }
  
}.initThisClass());
