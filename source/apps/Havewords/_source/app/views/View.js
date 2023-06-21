"use strict";

/* 
    View

*/

(class View extends Base {
  initPrototypeSlots() {
    this.newSlot("element", null);
    this.newSlot("tagName", "div");
    this.newSlot("id", null);
    this.newSlot("submitFunc", null);
    this.newSlot("target", null);
    this.newSlot("action", null);
    this.newSlot("canStore", true);
    this.newSlot("shouldStore", false);
    this.newSlot("hiddenDisplayType", null);
  }

  init() {
    super.init();
    this.setIsDebugging(false);
  }

  setShouldStore (aBool) {
    if (!this.canStore()) {
      throw new Error("unable to store button state");
    }
    this._shouldStore = aBool;
    return this;
  }

  style () {
    return this.element().style;
  }

  initElement() {
    this.style().display = "flex";
    this.style().flexDirection = "column";
    this.listenForChange();
  }

  setElement(e) {
    this._element = e;
    if (e) {
      assert(!e._view);
      e._view = this; // TODO: use WeakRef
    }
    return this;
  }

  create() {
    assert(!this.element());
    const e = document.createElement(this.tagName());
    this.setElement(e);
    this.initElement();
    return this;
  }

  superView () {
    const pe = this.element().parentNode;
    if (pe) {
      return pe._view;
    }
    return null;
  }

  addSubview (aView) {
    if (!aView.element()) {
      aView.create();
    }
    this.appendChild(aView.element());
    return this;
  }

  subviews () {
    const subviews = [];
    const e = this.element();
    const children = e.children;
    for (let i = 0; i < children.length; i++) {
      const view = children[i]._view;
      //assert(view);
      if (view) {
        subviews.push(view);
      } else {
        console.warn("found childNode with no _view property set");
      }
    }
    return subviews;
  }

  clear () {
    this.element().textContent = '';
    return this;
  }

  removeAllSubviews () {
    this.clear();
    return this;
  }

  setClassName (aName) {
    this.element().className = aName;
    return this;
  }

  setId(id) {
    this._id = id;
    if (this.element()) {
      this.element().id = id;
      return this;
    }
    this.attachToId(id);
    return this;
  }

  attachToId (id) {
    const e = document.getElementById(id);
    if (!e) {
      throw new Error("no element found for id '" + id + "'");
    }
    
    this.setElement(e);
    this.initElement();
    if (this.shouldStore()) {
      this.load();
    }
    return this;
  }

  appendChild(e) {
    this.element().appendChild(e);
    return this;
  }

  // --- content ---

  setInnerHTML(s) {
    this.element().innerHTML = s;
    return this;
  }

  // --- inner text ---

  setInnerText(s) {
    this.element().innerText = s;
    return this;
  }

  innerText() {
    return this.element().innerText;
  }

  // --- string value ---

  setString(s) {
    // an abstract way to set the string value of the view content
    // which allows subclasses to override it
    const e = this.element();
    if (e.tagName === "INPUT") {
      e.value = s;
    } else {
      this.setInnerHTML(s);
    }
    return this;
  }

  string() {
    const e = this.element();
    if (e.tagName === "INPUT") {
      return e.value;
    }
    return this.innerText();
  }

  // --- listening for events ---

  listenForFocus() {
    this.element().addEventListener("focus", (event) => {
      this.onFocus(event);
    });
  }

  onFocus (event) {
  }

  listenForBlur() {
    this.element().addEventListener("blur", (event) => {
      this.onBlur(event);
    });
  }

  onBlur (event) {
  }

  listenForChange() {
    this.element().addEventListener("change", (event) => {
      this.onChange(event);
    });
  }

  listenForClick() {
    assert(this.onClick);
    this.element().addEventListener("click", (event) => {
      this.onClick(event);
    });
    return this;
  }

  onClick () {
    if (this.target()) {
      this.sendDelegate("onClickView");
    }
  }

  listenForKeyUp() {
    this.element().addEventListener("keyup", (event) => {
      this.onKeyUp(event);
    });
    return this;
  }

  listenForKeyDown() {
    this.element().addEventListener("keydown", (event) => {
      this.onKeyDown(event);
    });
    return this;
  }

  // --- handling for events ---

  onChangeDescendant (changedView) {
    this.sendDelegate("onChangeDescendant", changedView);

    if (this.superView()) {
      this.superView().onChangeDescendant(changedView);
    }
  }

  sendDelegate(methodName, optionalArg) {
    const t = this.target();
    if (t) {
      const m = t[methodName];
      if (m) {
        m.apply(t, [this, optionalArg]);
        return true;
      }
    }
    return false;
  }

  onChange(event) {
    this.sendDelegate("onChange_" + this.id());

    if (this.shouldStore()) {
      this.save();
    }

    if (this.superView()) {
      this.superView().onChangeDescendant(this);
    }
    return this;
  }

  onKeyUp(event) {
    const enterKeyCode = 13;
    if (event.keyCode === enterKeyCode) {
      if (event.shiftKey) {
        this.onShiftEnterKeyUp(event);
      } if (event.altKey) {
        this.onAltEnterKeyUp(event);
      } else {
        this.onEnterKeyUp(event);
      }
    }

    const t = this.target();
    if (t) {
      const methodName = "onKeyUp_" + this.id();
      const m = t[methodName];
      if (m) {
        m.apply(t, this);
      }
    }
  }

  onAltEnterKeyUp(event) {}

  onShiftEnterKeyUp(event) {}

  onEnterKeyUp(enter) {}

  // --- key down events ---

  onKeyDown(event) {
    const enterKeyCode = 13;
    if (event.keyCode === enterKeyCode) {
      if (event.shiftKey) {
        this.onShiftEnterKeyDown(event);
      } else {
        this.onEnterKeyDown(event);
      }
    }
  }

  onShiftEnterKeyDown(event) {}

  onEnterKeyDown(enter) {}

  // --- actions ---

  submit() {
    // use sumbit function if set
    const f = this.submitFunc();
    if (f) {
      f();
    } else {
      //console.warn("no submit function set for " + this.description());
    }

    // use target & action if set
    const t = this.target();
    if (t) {
      if (this.action()) {
        const m = t[this.action()];
        if (m) {
          m.apply(t, [this]);
        } else {
          console.warn(
            "button target " +
              t.type() +
              " does not implement method for action '" +
              this.action() +
              "'"
          );
        }
      } else {
        // use action method name generated from element id
        const idAction = "onSubmit_" + this.id();
        const m = t[idAction];
        if (m) {
          m.apply(t, [this]);
        } else {
          console.warn(
            "button target " +
              t.type() +
              " does not implement method for action '" +
              idAction +
              "'"
          );
        }
      }
      return this;
    }
  }

  // --- helpers ---

  description() {
    return this.type() + " with id " + this.id();
  }

  // --- hiding ---

  toggleHidden() {
    this.setIsHidden(!this.isHidden());
    return this;
  }

  setIsHidden(aBool) {
    if (aBool) {
      this.hide();
    } else {
      this.unhide();
    }
    return this;
  }

  hide() {
    if (!this.isHidden()) {
      const e = this.element();
      const tag = e.tagName;
      let v = e.style.display;
      if (tag === "TABLE") {
        v = "table";
      } else if (tag === "TR") {
        v = "table-row";
      } else if (tag === "TD") {
        v = "table-cell";
      }
      this.setHiddenDisplayType(v);
      this.element().style.display = "none";
    }
    return this;
  }

  unhide() {
    if (this.isHidden()) {
      const hd = this.hiddenDisplayType();
      const d = hd ? hd : "block";
      this.element().style.display = d;
    }
    return this;
  }

  isHidden() {
    return this.element().style.display === "none";
  }

  // value

  tagIsFormInput () {
    return (["input", "textarea"].includes(this.tagName().toLowerCase()));
  }

  setValue (v) {
    if (this.tagIsFormInput()) {
      this.element().value = v;
    } else {
      this.element().innerHTML = v;
    }
    return this;
  }

  value () {
    if (this.tagIsFormInput()) {
      return this.element().value;
    } else {
      return this.element().innerHTML;
    }
  }

  // ----

  load () {
    const s = localStorage.getItem(this.id());
    if (s !== undefined) {
      this.debugLog("loading from localStorage " + this.type() + " " + this.id() + "value: '" + s + "'");
      this.setValue(s);
    }
    return this;
  }

  save() {
    const v = this.value();
    this.debugLog("saving " + this.type() + " id:" + this.id() + " value:'" + v + "'");
    localStorage.setItem(this.id(), v);
  }

  // --- style ---

  makeWidthFitContent () {
    this.setMinMaxWidth("fit-content");
    return this;
  }

  setMinMaxWidth(aString) {
    const s = this.element().style;
    s.minWidth = aString;
    s.width = aString;
    s.maxWidth = aString;
    return this;
  }

  setFlexDirection(s) {
    this.style().flexDirection = s;
    return this;
  }

  sendRespondingDescendants(methodName) {
    this.subviews().forEach(sv => {
      const m = sv[methodName];
      if (m) {
        m.apply(sv);
      }
      sv.sendRespondingDescendants(methodName);
    });
    return this;
  }

  toJson () {
    return this.value();
  }

}).initThisClass();
