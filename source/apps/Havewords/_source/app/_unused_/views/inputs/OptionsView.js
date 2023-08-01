"use strict";

/* 
    OptionsView

*/

(class OptionsView extends View {
  initPrototypeSlots() {}

  init() {
    super.init();
  }

  initElement() {
    super.initElement();
  }

  selectedElement() {
    const e = this.element();
    const selectedOptionElement = e.options[e.selectedIndex];
    return selectedOptionElement;
  }

  hasSelection () {
    const children = this.element().children;
    let result = false;
    for (var i = 0; i < children.length; i++) {
      const option = children[i];
      if (option.selected && option.value !== '') {
        result = true;
      }
    }
    return result;
  }  

  hasValue (s) {
    const children = this.element().children;
    let result = false;
    for (var i = 0; i < children.length; i++) {
      const option = children[i];
      if (option.value === s) {
        result = true;
      }
    }
    return result;
  }

  setSelectedLabel (s) {
    if (this.hasValue(s)) {
      const children = this.element().children;
      for (var i = 0; i < children.length; i++) {
        const option = children[i];
        const match = option.innerText === s;
        option.selected = match;
      }
    } else {
      console.warn("WARNING: " + this.type() + ".setSelectedLabel(" + s + ") - no such label in options");
    }
    return this;
  }

  setSelectedValue (s) {
    if (this.hasValue(s)) {
      const children = this.element().children;
      for (var i = 0; i < children.length; i++) {
        const option = children[i];
        const match = option.value === s;
        option.selected = match;
      }
    } else {
      if (s !== null) {
        console.warn(this.type() + "-" + this.id() + ".setSelectedValue(" + s + ") - no such value in options");
      }
    }
    return this;
  }

  selectedIndex() {
    return this.element().selectedIndex;
  }

  selectedValue() {
    const option = this.selectedElement();
    return option ? option.value : null;
  }

  selectedLabel() {
    return this.selectedElement().innerText;
  }

  /*
  selectedText() {
    return this.selectedLabel();
  }
  */

  // --- string ---

  setString (aString) {
    this.setSelectedValue(aString)
    return this
  }

  string () {
    return this.selectedValue()
  }

  // --- value ---

  setValue (v) {
    this.setSelectedValue(v)
    return this
  }

  value () {
    return this.selectedValue()
  }

  // ---

  onChange(event) {
    super.onChange(event);
    this.submit();
  }

  setOptions(array) {
    if (array === null || array === undefined) {
      array = [];
    }
   // assert(array);
    
    const previouslySelectedValue = this.selectedValue()
    //debugger;
    // array is expected to contain items like { label: "a", value: "b" } or ["foo", "bar"]
    const e = this.element();
    e.style.fontFamily = "inherit";
    e.innerHTML = "";
    array.forEach((item) => {
      let option;
      if (typeof(item) === "string") {
        option = new Option(item, item, false);
      } else {
        option = new Option(item.label, item.value, false);
      }
      option.style.fontFamily = "inherit";
      option.style.fontSize   = "inherit";
      option.style.fontWeight = "inherit";
      option._item = item;
      e.appendChild(option);
    });

    if (previouslySelectedValue) {
      this.setSelectedValue(previouslySelectedValue);
    }
    
    return this;
  }
}).initThisClass();
