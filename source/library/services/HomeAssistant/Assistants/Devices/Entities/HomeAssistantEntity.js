"use strict";

/* 
    HomeAssistantEntity

*/

(class HomeAssistantEntity extends BMSummaryNode {
  initPrototypeSlots() {
    /*
    {
      const slot = this.newSlot("url", 8124);
      slot.setInspectorPath("Settings")
      slot.setLabel("Url");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setSummaryFormat("value");
    }
*/

    /*
    {
      const slot = this.newSlot("scanAction", null);
      //slot.setInspectorPath("Character");
      slot.setLabel("Scan");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setCanInspect(true)
      slot.setActionMethodName("scan");
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

  /*
  subtitle () {
    return "Entity";
  }
  */
  
  finalInit () {
    super.finalInit();
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setSummaryFormat("key value");

    //this.scan();
  }

  setEntityJson (entityJson) {

    return this;
  }

/*
  scanActionInfo () {
    return {
        isEnabled: this.hasValidUrl(),
        //title: this.title(),
        subtitle: this.hasValidUrl() ? null : "Invalid Host URL",
        isVisible: true
    }
  }
  */

  
}).initThisClass();
