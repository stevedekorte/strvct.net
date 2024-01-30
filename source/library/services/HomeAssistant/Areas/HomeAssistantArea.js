"use strict";

/* 
    HomeAssistantArea

*/

(class HomeAssistantArea extends HomeAssistantObject {
  initPrototypeSlots() {

  }

  init() {
    super.init();
  }
  
  finalInit () {
    super.finalInit();
    this.setNodeCanEditTitle(true);
    //this.setNodeSubtitleIsChildrenSummary(true);
  }

  id () {
    return this.haJson().area_id;
  }

  updateTitle () {
    if (this.id()) {
      const parts = this.id().split("_");
      const s = parts.map(part => part.capitalized()).join(" ");
      this.setTitle(s);
    } else {
      this.setTitle("null");
    }
    return this;
  }

  connectObjects () {
    // no parents to connect to
  }

  updateTitles () {
    this.updateTitle();
    //this.updateSubtitle();
    this.setSubtitle("area");
    return this;
  }

  findOwner () {
    debugger;
    return null;
  }

  /*
  updateSubtitle () {
    const s = [
      this.subnodeCount() + " devices"
    ].join("\n");
    this.setSubtitle(s);
    return this;
  }

  addDevice (device) {
    device.removeFromParentNode();
    this.devicesNode().addSubnode(device);
    return this;
  }
  */

}).initThisClass();
