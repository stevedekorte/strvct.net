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

  onDidEditValue (valueView) {
    this.conversation().onChatEditValue(this.value())
  }

  onValueInput (changedView) {
    if (this.value()) {
      this.send()
    }
  }

  send () {
    //this.conversation().onChatInput(this)
    this.conversation().onChatInputValue(this.value())
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

}.initThisClass());
