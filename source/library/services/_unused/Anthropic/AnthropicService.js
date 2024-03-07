"use strict";

/* 
    AnthropicService

    A BMSummaryNode that holds the API key and subnodes for the various Anthropic services.

    Example:

    AnthropicService.shared().setApiKey("sk-1234567890");
    const hasApiKey = AnthropicService.shared().hasApiKey();


*/

(class AnthropicService extends BMSummaryNode {
  initPrototypeSlots () {

    {
      const slot = this.newSlot("chatModel", "gpt-4-turbo-preview");
      //slot.setInspectorPath("");
      slot.setLabel("Chat Model");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      //slot.setValidValues(values);
    }

    {
      const slot = this.newSlot("chatEndpoint", "https://api.openai.com/v1/chat/completions");
      //slot.setInspectorPath("");
      slot.setLabel("Chat Endpoint URL");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      //slot.setValidValues(values);
    }

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
      const slot = this.newSlot("models", null)
      slot.setFinalInitProto(OpenAiModels)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("conversations", null)
      slot.setFinalInitProto(OpenAiConversations)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("imagesPrompts", null)
      slot.setFinalInitProto(OpenAiImagePrompts)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("ttsSessions", null)
      slot.setFinalInitProto(OpenAiTtsSessions)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    /*
    {
      const slot = this.newSlot("jobs", null)
      slot.setFinalInitProto(OpenAiJobs)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }
    */

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("OpenAI");
    this.setSubtitle("AI services");
  }

  validateKey (s) {
    return s.length === 51 && s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

}.initThisClass());
