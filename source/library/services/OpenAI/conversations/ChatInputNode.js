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

  onValueInput () {
    this.send()
  }

  send () {
    this.conversation().onChatInput(this)
  }

}.initThisClass());
