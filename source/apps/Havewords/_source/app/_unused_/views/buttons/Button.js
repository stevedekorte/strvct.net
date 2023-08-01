"use strict";

/* 
    Button

    When clicked, button calls view submit function
*/

(class Button extends View {
  initPrototypeSlots() {
    this.newSlot("isDisabled", false);
    this.newSlot("iconElement", );
  }

  init() {
    super.init();
    this.setCanStore(false);
    this.setIsDebugging(true);
  }

  setIsDisabled (aBool) {
    this._isDisabled = aBool;
    const e = this.element()
    if (e) {
      if (aBool) {
        e.style.opacity = 0.25;
      } else {
        e.style.opacity = 1;
      }
    }
    return this;
  }

  setLabel (s) {
    this.setString(s);
    return this;
  }

  initElement () {
    super.initElement();
    this.listenForClick();
  }

  onClick (event) {
    if (this.isDisabled()) {
      // play an error beep?
    } else {
      this.submit();
    }
  }

  setIconPath (aPath) {
    this.element().innerHTML = "";
    if (aPath) {
      const svg = document.createElement("object");
      this.setIconElement(svg);
      svg.setAttribute("type", "image/svg+xml");
      svg.setAttribute("data", aPath);
      svg.style.pointerEvents = "none"; // to avoid clicks going to svg object
      svg.style.width = "100%";
      svg.style.height = "100%"; // Careful, aspect ratio of button might not match that of svg!
      this.element().appendChild(svg);
      this.element().style.overflow = "hidden";
    }
    return this
  }

}.initThisClass());

