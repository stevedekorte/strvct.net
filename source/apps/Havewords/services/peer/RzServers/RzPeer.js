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


    {
      const slot = this.newSlot("connectAction", null);
      slot.setInspectorPath("")
      slot.setLabel("Connect")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("connect");
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

  connect () {
    /*
    const hostConnection = PeerServer.shared().connectToPeerId(this.hostId());
    hostConnection.setDelegate(this);
    this.setHostConnection(hostConnection);
    */
  }

}.initThisClass());
