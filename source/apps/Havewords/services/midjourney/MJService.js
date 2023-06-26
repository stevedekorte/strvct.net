"use strict";

/* 
    MJService

*/

(class MJService extends BMSummaryNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("apiKey", "")
      //slot.setInspectorPath("")
      slot.setLabel("API Key")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      //slot.setValidValues(values)
    }

    {
      const slot = this.newSlot("apiBaseUrl", "")
      slot.setInspectorPath("")
      slot.setLabel("API Base URL")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setInitValue("https://api.midjourneyapi.io/v2")
      slot.setIsSubnodeField(true)
      //slot.setValidValues(values)
    }

    {
      const slot = this.newSlot("jobs", null)
      slot.setLabel("Jobs")
      slot.setFinalInitProto(MJImageJobs)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    this.setShouldStore(true)
    this.setShouldStoreSubnodes(false)
  }

  init () {
    super.init()
    this.setTitle("Midjourney")
    this.setSubtitle("image generation service")
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(false)
  }

  /*
  didUpdateSlot (aSlot, oldValue, newValue) {
    super.didUpdateSlot(aSlot, oldValue, newValue);
    if (this.parentNode()) {
      debugger;
      assert(this.hasMutationObservers());
    }
  }
  */

  finalInit () {
    super.finalInit()
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(false)
  }

  validateKey (s) {
    // example: 88888888-4444-4444-4444-121212121212
    // this just check's it's format, but can't tell if it actually works
    if (!s) {
      return false;
    }
    return /^[a-z0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(s)
  }

  validateBaseUrl (s) {
    // this just check's it's format, but can't tell if it actually works
    if (!s) {
      return false;
    }
    return /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/.test(s)
  }

  hasApiAccess () {
    return this.validateKey(this.apiKey()) && this.validateBaseUrl(this.apiBaseUrl())
  }

}.initThisClass());
