"use strict";

/*

    HwSession

*/

(class HwSession extends BMSummaryNode {

  initPrototypeSlots () {
    {
        const slot = this.newSlot("settings", null)
        slot.setShouldStoreSlot(true);
        slot.setFinalInitProto(HwSessionSettings);
        slot.setIsSubnode(true);
    }

    {
        const slot = this.newSlot("players", null)
        slot.setShouldStoreSlot(true);
        slot.setFinalInitProto(HwPlayers);
        slot.setIsSubnode(true);
    }

    {
        const slot = this.newSlot("aiChat", null)
        slot.setShouldStoreSlot(true);
        slot.setFinalInitProto(HwAiChat);
        slot.setIsSubnode(true);
    }

    {
        const slot = this.newSlot("playersChat", null)
        slot.setShouldStoreSlot(true);
        slot.setFinalInitProto(HwPlayersChat);
        slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("isHost", true);
      //slot.setInspectorPath("")
      slot.setLabel("Is Host");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Boolean");
      slot.setCanEditInspection(false)
    }

  }

  init () {
    super.init();

    this.addNodeAction("add");
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled");
    //this.setSubtitle("session");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  sessions () {
    return this.parentNode()
  }

  sessionType () {
    return "session" + (this.isHost() ? " host" : "")
  }

  subtitle () {
    const genre = this.settings().genre()
    if (genre) {
      return genre + " " + this.sessionType()
    }
    return this.sessionType()
  }

  finalInit () {
    super.finalInit();
    this.settings().promptComposer().compose()
  }

  isReadyToStart () {
    
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
