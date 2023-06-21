"use strict";

/* 
    TextFieldView

*/

(class TextFieldView extends View {
  initPrototypeSlots () {
    this.newSlot("validationFunc", null);
    this.newSlot("shouldFitContent", false);
    this.newSlot("isEditable", true);
  }

  init () {
    super.init();
    this.setTagName("input");
  }

  initElement () {
    super.initElement();
    this.setClassName("TextFieldView");
    this.listenForKeyDown();
    this.listenForKeyUp();
    this.updateDisabled();
  }

  setIsEditable (aBool) {
    this._isEditable = aBool;
    this.updateDisabled();
    return this;
  }

  useEditableStyle () {
    this.style().borderBottom = "1px solid rgba(255, 255, 255, 0.2)";
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

  onEnterKeyDown (event) {
    this.submit();
    event.target.blur();
  }

  setValue (s) {
    this.setString(s);
    return this;
  }
  
  value () {
    return this.string();
  }

  setString(s) {
    super.setString(s);
    this.resizeIfNeeded();
    return this;
  }

  setPlaceholder(placeholder) {
    this.element.placeholder = placeholder;
    return this;
  }

  onKeyUp (event) {
    super.onKeyUp(event);
    this.validate()
    this.resizeIfNeeded();
  }

  submit () {
    this.validate()
    if (this.isValid()) {
      super.submit()
    }
  }

  validate () {
    if (this.isValid()) {
      this.element().style.color = "white";
    } else {
      this.element().style.color = "red";
    }
  }

  isValid () {
    const f = this.validationFunc();
    if (f) {
      const isValid = f(this.string());
      return isValid;
    }
    return true
  }

  resizeIfNeeded () {
    if (this.shouldFitContent()) {
      this.resizeWidthToFitContent();
    }
    return this;
  }

  resizeWidthToFitContent() {
    const e = this.element();

    let size = e.value.length ? e.value.length : e.placeholder.length;
    size *= 1.1;
    e.setAttribute("size", size + "em");
    return this;
  }
  
}.initThisClass());
