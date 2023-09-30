"use strict";

/* 
    RadioButton

    

*/

(class RadioButton extends Button {
  initPrototypeSlots() {
    this.newSlot("state", false);

    // icon
    this.newSlot("onIconPath", null);
    this.newSlot("offIconPath", null);

    // label
    this.newSlot("onLabel", null);
    this.newSlot("offLabel", null);

    // opacity
    this.newSlot("onOpacity", 1);
    this.newSlot("offOpacity", 0.5);

    // color
    this.newSlot("onColor", "inherit");
    this.newSlot("offColor", "inherit");
  }

  init() {
    super.init();
    this.setCanStore(true);
    this.setIsDebugging(false);
  }

  // --- label ---

  setAutoLabel (s) {
    this.setOnLabel(s + " On");
    this.setOffLabel(s + " Off");
    this.update();
    return this;
  }

  // --- value ---

  setValue (v) {
    const aBool = v === "true" ? true : false;
    this.setState(aBool)
    return this
  }

  value () {
    return this.state() ? "true" : "false";
  }

  // --- state ---

  setState (aBool) {
    this._state = aBool;
    this.update();
    return this;
  }

  update () {
    this.updateIcon();
    this.updateLabel();
    this.updateOpacity();
    this.updateColor();
  }

  setOnIconPath (aPath) {
    this._onIconPath = aPath;
    this.update();
    return this;
  }

  setOffIconPath (aPath) {
    this._offIconPath = aPath;
    this.update();
    return this;
  }

  updateIcon () {
    if (this.state()) {
      this.setIconPath(this.onIconPath());
    } else {
      this.setIconPath(this.offIconPath());
    }
    return this;
  }

  setLabel (s) {
    this.element().innerHTML = s;
    return this;
  }

  updateLabel () {
    if (this.onLabel() && this.offLabel()) {
      if (this.state()) {
        this.setLabel(this.onLabel());
      } else {
        this.setLabel(this.offLabel());
      }
    }
  }

  setColor (c) {
    this.element().style.color = c;
    return this;
  } 

  updateColor () {
    if (this.state()) {
      this.setColor(this.onColor());
    } else {
      this.setColor(this.offColor());
    }
  }

  setOpacity (v) {
    this.element().style.opacity = v;
    return this;
  }

  updateOpacity () {
    if (this.state()) {
      this.setOpacity(this.onOpacity());
    } else {
      this.setOpacity(this.offOpacity());
    }
  }

  toggle () {
    this.setState(!this.state());
    this.onChange(null);
    return this;
  }

  submit () {
    this.toggle(); // toggle first?
    super.submit();
    Sounds.shared().playSendBeep();
    return this;
  }

}.initThisClass());

