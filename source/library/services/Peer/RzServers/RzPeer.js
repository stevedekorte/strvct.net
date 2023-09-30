"use strict";

/* 

    RzPeer

*/

(class RzPeer extends BMStorableNode {

  initPrototypeSlots() {

    {
      const slot = this.newSlot("peerId", "");      
      slot.setInspectorPath("")
      slot.setLabel("peer id")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(false)
      slot.setCanEditInspection(false)
    }

    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setIsDebugging(false)
    this.setCanDelete(false)
    return this
  }

  finalInit () {
    super.finalInit()
    this.setCanDelete(false)
  }

  title () {
    return this.peerId()
  }

  subtitle () {
    return "peer"
  }

  server () {
    return this.parentNode().parentNode()
  }

}.initThisClass());
