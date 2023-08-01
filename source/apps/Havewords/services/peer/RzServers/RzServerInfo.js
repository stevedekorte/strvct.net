"use strict";

/* 
    RzServerInfo

*/

(class RzServerInfo extends BMSummaryNode {
  initPrototypeSlots() {

    /*
    {
      host: "peerjssignalserver.herokuapp.com",
      path: "/peerjs",
      secure: true,
      port: 443,
      reliable: true,
      pingInterval: 1000, // 1 second
      debug: false
    }
    */

    {
      const slot = this.newSlot("host", "peerjssignalserver.herokuapp.com");      
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("path", "/peerjs");      
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("port", 443);      
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("value")
    }


    {
      const slot = this.newSlot("isSecure", true);      
      slot.setInspectorPath("")
      slot.setLabel("is secure")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(true)
      slot.setSummaryFormat("key value")
    }

    this.setShouldStoreSubnodes(false);
    this.setNodeSubtitleIsChildrenSummary(false)
  }

  init() {
    super.init();
    this.setTitle("options")
    this.setIsDebugging(false)
    return this
  }

  getPeersUrl () {
    return "https://" + this.host() + this.path() + '/api/peers';
  }

}.initThisClass());
