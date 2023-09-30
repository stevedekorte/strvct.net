"use strict";

/* 

    JsonView

*/

(class JsonView extends View {
  initPrototypeSlots() {
    this.newSlot("json", null);
  }

  init() {
    super.init();
    this.create();
  }

  initElement() {
    super.initElement();
    const e = this.element();
    e.style.overflow = "hidden";
    //e.style.fontSize = "13px";
    //e.style.lineHeight = "1.1em";

    e.style.display = "flex";
    e.style.justifyContent = "left";
    e.style.flexDirection = "column";

    //e.style.border = "1px solid rgba(255, 255, 255, 0.1)";
    e.style.padding = "0em";
    /*
    e.style.paddingLeft = "0.2em";
    e.style.paddingRight = "0.2em";
    e.style.paddingTop = "0.2em";
    e.style.paddingBottom = "0.2em";
    */

    return this;
  }

  setJson(json) {
    this._json = json;
    this.setupSubviews();
    return this;
  }

  setupSubviews() {
    this.removeAllSubviews();
  }

  newViewForValue(v) {
    const type = this.detectType(v);
    //console.log("type: ", type);
    //debugger;
    let viewClassName = type + "View";
    
    if (type === "String") {
      const view = StringView.clone().create().setValue(v);
      view.setIsEditable(true);
      return view;
    } else if (type === "Number") {
      const view = NumberView.clone().create().setValue(v);
      view.setIsEditable(true);
      return view;
    }

    const viewClass = getGlobalThis()[viewClassName];
    if (!viewClass) {
      throw new Error("no view for type " + viewClassName);
    }
    const view = viewClass.clone().setJson(v);
    return view;
  }

  detectType(value) {
    if (Array.isArray(value)) {
      return "Array";
    } else if (typeof value === "object" && value !== null) {
      return "Object";
    } else if (typeof value === "number") {
      return "Number";
    } else if (typeof value === "string") {
      return "String";
    } else {
      return "Unknown";
    }
  }

  typeIsCollection(v) {
    return ["Array", "Object"].includes(this.detectType(v));
  }
}).initThisClass();
