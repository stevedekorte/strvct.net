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
      const slot = this.newSlot("genreOptions", null);
    }

    /*
    {
      const slot = this.newSlot("genreOptionsPaths", null);
    }
    */

    {
        const slot = this.newSlot("customInstructions", "");
        //slot.setInspectorPath("")
        slot.setLabel("custom instructions")
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
        slot.setLabel("Voice Narration");
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

    {
      const slot = this.newSlot("promptComposer", null)
      slot.setShouldStoreSlot(true);
      slot.setFinalInitProto(HwPromptComposer);
      slot.setIsSubnode(true);
    }


    {
      const slot = this.newSlot("inviteLink", "");
      //slot.setInspectorPath("")
      slot.setLabel("invite link")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      //slot.setValidValues(values)
  }

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
  }

  init () {
    super.init();
    this.addNodeAction("add");
    this.setCanDelete(false);
    this.setNodeCanEditTitle(false);
    this.setTitle("Settings");
    this.setSubtitle("");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  finalInit () {
    super.finalInit();
    //this.setupSessionOptions()
    //debugger
  }

  session () {
    return this.parentNode()
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

  startSession () {
    const chat = this.session().aiChat()
    chat.clear()
    const msg = chat.newMessage()
    msg.setRole("system")
    msg.setContent(this.promptComposer().completedPrompt())
    msg.send()
  }

}).initThisClass();
