"use strict";

/* 
    Node

    Class that supports protocol to sync to a NodeView.

*/

(class Node extends Base {
  initPrototypeSlots() {
    this.newSlot("title", null);
    this.newSlot("subtitle", null);
    this.newSlot("subnodes", null);
    this.newSlot("subnodeClass", null);
    this.newSlot("onChangeTimer", null);
  }

  init() {
    super.init();
    this.setTitle(this.type());
    this.setIsDebugging(false);
    this.setSubnodes([]);
  }

  addSubnodeWithJson (json) {
    const subnode = this.subnodeClass().clone().setJson(json);
    this.addSubnode(subnode);
    return subnode;
  }

  addSubnode(aNode) {
    this.subnodes().push(aNode);
    this.scheduleOnChange();
    return this;
  }

  removeSubnode(aNode) {
    const i = this.subnodes().indexOf(aNode);
    if (i !== -1) {
      this.subnodes().splice(i, 1);
      this.scheduleOnChange();
    }
    return this;
  }

  removeAllSubnodes() {
    this.subnodes().clear();
    return this;
  }

  scheduleOnChange () {
    if (!this.onChangeTimer()) {
      const timer = setTimeout(() => {
        this.setOnChangeTimer(null);
        this.onChange()
      }, 0);
      this.setOnChangeTimer(timer);
    }
    return this;
  }

  onChange () {
    // to be overridden
  }

}).initThisClass();
