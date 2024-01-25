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

    {
      const slot = this.newSlot("jsonString", "");
      slot.setCanEditInspection(false);
      slot.setCanInspect(true);
      //slot.setInspectorPath("Info");
      slot.setLabel("json");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      //slot.setIsSubnodeField(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setTitle("");
    this.setCanDelete(true);
  }
  
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setNodeSubtitleIsChildrenSummary(true);
    this.setSummaryFormat("key value");
  }

  jsonString () {
    return JSON.stringify(this.haJson(), 2, 2);
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
