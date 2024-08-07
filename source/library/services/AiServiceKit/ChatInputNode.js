"use strict";

/* 
    ChatInputNode 

*/

(class ChatInputNode extends BMTextAreaField {
  initPrototypeSlots () {

    {
      const slot = this.newSlot("conversation", null); 
      slot.setInspectorPath("")
      //slot.setLabel("role")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      //slot.setDuplicateOp("duplicate")
      slot.setSlotType("Object");
      //slot.setCanInspect(true)
    }

    {
      const slot = this.newSlot("hasValueButton", false);
      slot.setSlotType("Boolean");
      slot.setSyncsToView(true);
    }

    {
      const slot = this.newSlot("isMicOn", false);
      slot.setSlotType("Boolean");
      slot.setSyncsToView(true);
    }

    /*
    {
      const slot = this.newSlot("sttSession", null);
    }
    */
  }

  initPrototype () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);

    this.setNodeTileClassName("BMChatInputTile");
    this.setKeyIsVisible(false);
    this.setValue("");
    this.setCanDelete(true);
  }


  /*
  didUpdateSlotValue (oldValue, newValue) {
    super.didUpdateSlotValue(oldValue, newValue);
    return this;
  }
  */

  setValue (v) {
    //console.log("ChatInputNode setValue('" + v + "')");
    super.setValue(v);
    return this;
  }

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
    //debugger;
    this.setValue(""); // clear input view
    //this.addTimeout(() => {
      // there seems to be an issue sometimes with the view not getting the update 
      // this timeout is a temporary fix
      this.scheduleSyncToView();
    //}, 1);
    //this.scheduleSyncToView();
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

  /*
  disable () {
    //this.setValueIsEditable(false);
    return this;
  }

  enable () {
    //this.setValueIsEditable(true);
    return this;
  }
  */

}.initThisClass());
