"use strict";

/* 
    HomeAssistantDevice

*/

(class HomeAssistantDevice extends BMSummaryNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("deviceJson", null)
      slot.setShouldStoreSlot(true);
    }

    /*
    {
      const slot = this.newSlot("entitiesNode", null)
      slot.setFinalInitProto(HomeAssistantEntities);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }
    */

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
  }

  /*
  subtitle () {
    return "Device";
  }
  */

  didUpdateSlotDeviceJson (oldValue, newValue) {
    const deviceJson = newValue;
    this.setTitle(newValue.name);
    this.setSubtitle(newValue.id);
    return this;
  }

}).initThisClass();
