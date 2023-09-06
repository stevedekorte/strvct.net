"use strict";

/*

    HwPlayer

*/

(class HwPlayer extends BMSummaryNode {

  initPrototypeSlots () {
    // id, nickname, avatar, playerSheet

    {
      const slot = this.newSlot("character", null);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      //slot.setValidValues(["on", "off"]);
      //slot.setInitValue("off");
      slot.setInitValue(false);
  }

  }

  init () {
    super.init();

    this.removeNodeAction("add");
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled");
    this.setSubtitle("player");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);

    this.setCharacter(Character.clone());
  }

  finalInit () {
    super.finalInit();
  }

  characterSheetJson () {
    const char = this.character();

    if (char) {
      return char.jsonArchive()
    }

    return { "error" : "no character assigned to this player" }
  }

}).initThisClass();
