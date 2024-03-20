"use strict";

/* 
    AiChatModel

*/

(class AiChatModel extends BMSummaryNode {
  initPrototypeSlots () {

    {
      const slot = this.newSlot("modelName", null);
      //slot.setInspectorPath("");
      slot.setLabel("Name");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      //slot.setValidValues(values);
    }


    {
      const slot = this.newSlot("maxContextTokenCount", 8000); // max input tokens allowed by model
      slot.setLabel("Max Token Count");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("AI Model");
  }

  subtitle () {
    return this.modelName();
  }

  validateKey (s) {
    return s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey() && this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

}.initThisClass());
