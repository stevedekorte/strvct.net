"use strict";

/* 
    HomeAssistantArea

*/

(class HomeAssistantArea extends HomeAssistantObject {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("id", null)
    }

    {
      const slot = this.newSlot("name", null)
    }

    {
      const slot = this.newSlot("devicesNode", null)
      slot.setFinalInitProto(HomeAssistantDevices);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
    }

  }

  init() {
    super.init();
  }
  
  finalInit () {
    super.finalInit();
    this.setNodeCanEditTitle(true);
    this.setNodeSubtitleIsChildrenSummary(true);
  }

  didUpdateSlotId (oldValue, newValue) {
    this.updateTitle();
    return this;
  }

  updateTitle () {
    const parts = this.id().split("_");
    const s = parts.map(part => part.capitalized()).join(" ");
    this.setTitle(s);
    return this;
  }

  didUpdateSlotHaJson (oldValue, newValue) {
    throw new Error("this shouldn't get called");
    return this;
  }

  completeSetup () {
    this.updateTitle();
    this.updateSubtitle();
  }

  updateSubtitle () {
    const s = [
      this.id(), 
      this.devicesNode().subnodeCount() + " devices"
    ].join("\n");
    this.setSubtitle(s);
    return this;
  }

  subtitle () {
    const s = [
      this.devicesNode().subnodeCount() + " devices"
    ].join("\n");
    return s;
  }

  addDevice (device) {
    device.removeFromParentNode();
    this.devicesNode().addSubnode(device);
    return this;
  }

}).initThisClass();
