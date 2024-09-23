"use strict";

/* 
    RzMsg

*/

(class RzMsg extends BMSummaryNode {

  initPrototypeSlots () {

    {
      const slot = this.newSlot("id", null);
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      //slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("content", null);
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      //slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("status", ""); // sent, received
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      //slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("sendAction", null);
      slot.setInspectorPath("")
      slot.setLabel("Send")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("send");
    }
    
    {
      const slot = this.newSlot("peer", null);
    }

    this.setShouldStoreSubnodes(false);
    this.setCanDelete(true)
  }

  init() {
    super.init();
    this.setStatus("");
    this.setIsDebugging(true);
    return this;
  }

  title () {
    return this.id() ? this.id() : "no message id"
  }

  subtitle () {
    return this.status()
  }

  // --- sending ---

  send (json) {
    if (!this.conn()) {
      console.warn("attempt to send to closed connection ", this.peerId());
      return;
    }
    this.conn().send(json);
  }

  sendThenClose (json) {
    this.send(json);
    setTimeout(() => {
      this.shutdown();
    }, 500); // without delay, send doesn't occur
  }

  // --- helpers ---

  peerMessages () {
    return this.parentNode()
  }

  peerConn () {
    return this.peerMessages().peerConn()
  }

  isConnected () {
    return this.peerConn().isConnected()
  }

  // --- sending ---

  send () {
    this.peerConn().send(this.content()) // content should be valid JSON
    this.setStatus("sent")
  }

  sendActionInfo () {
    return {
      isEnabled: this.isConnected()
    }
  }

  // -- receiving ---

  onReceived () {
    this.setStatus("received")
  }

}.initThisClass());
