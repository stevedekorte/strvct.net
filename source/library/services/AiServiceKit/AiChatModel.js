"use strict";

/**
 * @module AiServiceKit
 * @class
 * @memberof module:AiServiceKit
 * @extends BMSummaryNode
*/

(class AiChatModel extends BMSummaryNode {
  initPrototypeSlots () {

    {
      const slot = this.newSlot("service", null);
      slot.setSlotType("AiService");
    }

    {
      const slot = this.newSlot("modelName", null);
      //slot.setInspectorPath("");
      slot.setLabel("name");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      //slot.setValidValues(values);
    }


    {
      const slot = this.newSlot("maxContextTokenCount", 8000); // max input tokens allowed by model
      slot.setLabel("context window");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
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
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
  }

  service () {
    if (this._service) {
      return this._service;
    }
    return this.parentNode().parentNode();
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

  setJson (json) {
    assert(json.name);
    this.setModelName(json.name);

    if (json.title) {
      this.setTitle(json.title);
    } else {
      this.setTitle(json.name);
    }

    const cw = json.contextWindow;
    assert(Type.isNumber(cw));
    this.setMaxContextTokenCount(cw);
    return this;
  }

  summary () {
    const cw = NumberFormatter.clone().setValue(this.maxContextTokenCount()).setSignificantDigits(2).formattedValue();

    return this.modelName() + " (" + cw + ")\n";
  }

}.initThisClass());
