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

    {
      const slot = this.newSlot("isSelf", false);
      //slot.setInspectorPath("")
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Boolean");
      //slot.setIsSubnodeField(true);
    }

    {
      const slot = this.newSlot("kickAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Kick");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("kick");
    }

    {
      const slot = this.newSlot("peerConnection", null);
    }
  }

  init () {
    super.init();

    this.removeNodeAction("add");
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setSubtitle("player");
    this.setNodeCanReorderSubnodes(false);
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);

    this.setCharacter(Character.clone());
  }

  finalInit () {
    super.finalInit();
  }

  title () {
    return this.character().title()
  }

  subtitle () {
    const prefix = this.isSelf() ? "(me) " : ""
    return prefix + this.character().subtitle()
  }

  characterSheetJson () {
    const char = this.character();

    if (char) {
      return char.jsonArchive()
    }

    return { "error" : "no character assigned to this player" }
  }

  name () {
    return this.character().name()
  }

  updateJson (json) {
    this.character().updateJson(json)
  }

  kick () {

  }

  kickActionInfo () {
    return {
        isEnabled: !this.isSelf(),
        //title: this.title(),
        isVisible: !this.isSelf()
    }
}


}).initThisClass();
