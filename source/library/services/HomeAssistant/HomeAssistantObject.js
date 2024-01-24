"use strict";

/* 
    HomeAssistantObject

*/

(class HomeAssistantObject extends BMSummaryNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("haJson", null)
      slot.setShouldStoreSlot(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setTitle("");
    this.setCanDelete(true);
    this.setSubtitle(this.type());
  }
  
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setNodeSubtitleIsChildrenSummary(true);
    this.setSummaryFormat("key value");
  }

  /*
  didUpdateSlotHaJson (oldValue, newValue) {
    this.setTitle(newValue.name);
    this.setSubtitle(newValue.id);
    return this;
  }
  */

  homeAssistantGroup () {
    return this.parentNode();
  }

  homeAssistant () {
    return this.homeAssistantGroup().parentNode();
  }

  completeSetup () {
    throw new Error("subclasses should implement this method");
  }

  id () {
    throw new Error("subclasses should implement this method");
  }

}).initThisClass();
