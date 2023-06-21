"use strict";

/* 
    OpenAiService

*/

(class OpenAiService extends BMSummaryNode {
  initPrototypeSlots () {
    {
      const slot = this.newSlot("apiKey", "")
      slot.setInspectorPath("")
      slot.setLabel("API Key")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      //slot.setValidValues(values)
    }

    {
      const slot = this.newSlot("apis", "")
    }

    {
      const slot = this.newSlot("models", null)
      slot.setFinalInitProto(OpenAiModels)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
    this.setTitle("OpenAI Chat");
    this.setSubtitle("service");
  }

  validateKey (s) {
    return s.length === 51 && s.startsWith("sk-");
  }

}.initThisClass());
