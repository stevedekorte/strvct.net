"use strict";

/* 
  
      ObjectView
  
  */

(class ObjectView extends JsonView {
  /*
    initPrototypeSlots() {
    }
  
    init() {
      super.init();
    }
    */

  initElement() {
    super.initElement();

    const e = this.element();
    //e.style.borderLeft = "1px solid rgba(255, 255, 255, 0.1)";
    e.style.paddingLeft = "4px";
    e.style.paddingRight = "1em";

    return this;
  }


  setupSubviews() {
    this.removeAllSubviews();
    const json = this.json();
    const keys = Object.getOwnPropertyNames(json);

    keys.forEach((key) => {
      const value = json[key];
      const vtype = this.detectType(value);
      //const isCollection = this.typeIsCollection(value);
      const isLongArray = (vtype === "Array" && value.length > 0) ;
      const isLongObject = (vtype === "Object" && Object.keys(value).length > 0) ;
      const isLongString = (typeof(value) === "string" && value.length > 32);
      const isCollection = isLongArray || isLongObject || isLongString;
      const kv = KVView.clone();
      const keyView = this.newViewForValue(key); //.makeWidthFitContent();
      keyView.setIsEditable(false);
      keyView.setMinMaxWidth("7em");
      keyView.element().style.textAlign = "right";
      keyView.element().style.paddingRight = "0.5em";
      //keyView.element().style.border = "1px solid red";
      kv.keyView().addSubview(keyView);
      kv.topView().element().style.opacity = 0.5;
      kv.keyView().makeWidthFitContent();

      const valueView = this.newViewForValue(value);
      //valueView.setIsEditable(true);
      kv.valueView().addSubview(valueView);
      if (isLongString) {
        valueView.style().width = "16em"
        valueView.style().height = "8em"
      }

      if (isCollection) {
        kv.setIsCollapsable(true);
        kv.stackVertically();
        kv.valueView().hide();
      }

      this.addSubview(kv);
    });
    return this;
  }

  toJson() {
    const json = {};
    this.subviews().forEach(sv => {
      const k = sv.keyView().subviews()[0].value();
      const v = sv.valueView().subviews()[0].toJson();
      json[k] = v;
    });
    return json;
  }

}).initThisClass();
