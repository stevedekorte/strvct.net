"use strict";

/* 
    ChatInputNode 

*/

(class ChatInputNode extends BMTextAreaField {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("conversation", null); 
      slot.setInspectorPath("")
      //slot.setLabel("role")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      //slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      //slot.setCanInspect(true)
    }

    {
      const slot = this.newSlot("hasValueButton", false);
      slot.setSyncsToView(true);
    }

    {
      const slot = this.newSlot("isMicOn", false);
      slot.setSyncsToView(true);
    }

    /*
    {
      const slot = this.newSlot("sttSession", null);
    }
    */

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
    this.setKeyIsVisible(false)
    this.setValue("")
    this.setCanDelete(true)
  }

  finalInit () {
    super.finalInit();
    this.setNodeTileClassName("BMChatInputTile")
    this.setKeyIsVisible(false)
  }

  /*
  didUpdateSlotValue (oldValue, newValue) {
    super.didUpdateSlotValue(oldValue, newValue);
    return this;
  }
  */

  // --- value change events ---

  onDidEditValue (valueView) {
    this.conversation().onChatEditValue(this.value())
  }

  acceptsValueInput () {
    return this.conversation() && this.conversation().acceptsChatInput();
  }

  onValueInput (changedView) {
    if (this.value()) {
      this.send()
    }
  }

  // --- sending ---

  send () {
    //this.conversation().onChatInput(this)
    const v = this.value();
    this.conversation().onChatInputValue(v);
    debugger;
    this.setValue(""); // clear input view
  }

  /*

  valueButtonIconName () {
    return this.isMicOn() ? "Mic On" : "Mic Off";
  }

  onClickValueButton () {
    this.setIsMicOn(!this.isMicOn());
    console.log("this.isMicOn():", this.isMicOn());
    if (this.isMicOn()) {
      this.setupSttSessionIfNeeded();
      this.sttSession().start();
    } else {
      if (this.sttSession()) {
        this.sttSession().stop();
      }
    }
    this.didUpdateNode();
  }
  */

  disable () {
    this.setValueIsEditable(false);
    return this;
  }

  enable () {
    this.setValueIsEditable(true);
    return this;
  }

}.initThisClass());
