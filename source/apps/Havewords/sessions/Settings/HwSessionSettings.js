"use strict";

/*

    HwSessionSettings

*/

(class HwSessionSettings extends BMSummaryNode {

  initPrototypeSlots () {

    //sessionOptionsJson

    {
      const slot = this.newSlot("genre", "");
      //slot.setInspectorPath("")
      slot.setLabel("Genre")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setAllowsMultiplePicks(false)
      slot.setValidValues(getGlobalThis().sessionOptionsJson)
    }

    {
        const slot = this.newSlot("custom instructions", "");
        //slot.setInspectorPath("")
        //slot.setLabel("input text")
        slot.setShouldStoreSlot(true);
        slot.setDuplicateOp("duplicate");
        slot.setSlotType("String");
        slot.setIsSubnodeField(true);
        //slot.setValidValues(values)
    }

    /*

    {
        const slot = this.newSlot("language", null);
        slot.setInspectorPath("");
        slot.setLabel("Start");
        //slot.setShouldStoreSlot(true)
        slot.setSyncsToView(true);
        slot.setDuplicateOp("duplicate");
        slot.setSlotType("Action");
        slot.setIsSubnodeField(true);
        slot.setActionMethodName("start");
    }
    */

    {
        const slot = this.newSlot("music", "");
        //slot.setInspectorPath("")
        slot.setLabel("Music");
        slot.setShouldStoreSlot(true);
        slot.setSyncsToView(true);
        slot.setDuplicateOp("duplicate");
        slot.setSlotType("Boolean");
        slot.setIsSubnodeField(true);
        //slot.setValidValues(["on", "off"]);
        //slot.setInitValue("off");
        slot.setInitValue(false);

    }

    {
        const slot = this.newSlot("narration", "");
        //slot.setInspectorPath("")
        slot.setLabel("Narration");
        slot.setShouldStoreSlot(true);
        slot.setSyncsToView(true);
        slot.setDuplicateOp("duplicate");
        slot.setSlotType("Boolean");
        slot.setIsSubnodeField(true);
        //slot.setValidValues(["on", "off"]);
        //slot.setInitValue("off");
        slot.setInitValue(false);
    }

    // toggle music
    // toggle narration
    // copy invite link
    // copy transcript

    /*
    {
      const slot = this.newSlot("startSessionAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Start");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("startSession");
    }

      {
        const slot = this.newSlot("resetSessionAction", null);
        slot.setInspectorPath("");
        slot.setLabel("Reset Session");
        //slot.setShouldStoreSlot(true)
        slot.setSyncsToView(true);
        slot.setDuplicateOp("duplicate");
        slot.setSlotType("Action");
        slot.setIsSubnodeField(true);
        slot.setActionMethodName("resetSession");
      }
      */
  }

  init () {
    super.init();

    this.addAction("add");
    this.setCanDelete(false);
    this.setNodeCanEditTitle(true);
    this.setTitle("Settings");
    this.setSubtitle("");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  finalInit () {
    super.finalInit();
    //this.setupSessionOptions()
  }

  startSession () {

  }

  resetSession () {

  }

  didUpdateSlotMusic (oldValue, newValue) {
    console.log("music: ", newValue)
  }

  didUpdateSlotNarration (oldValue, newValue) {
    console.log("narration: ", newValue)
  }

}).initThisClass();
