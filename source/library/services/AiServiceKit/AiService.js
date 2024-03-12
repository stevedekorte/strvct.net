"use strict";

/* 
    AiService

    A BMSummaryNode that holds the API key and subnodes related to the service.

    Example:

    AiService.shared().setApiKey("sk-1234567890");
    const hasApiKey = AiService.shared().hasApiKey();


*/

(class AiService extends BMSummaryNode {
  initPrototypeSlots () {

    {
      const slot = this.newSlot("chatModel", null);
      //slot.setInspectorPath("");
      slot.setLabel("Chat Model");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      //slot.setValidValues(values);
    }

    {
      const slot = this.newSlot("chatEndpoint", null);
      //slot.setInspectorPath("");
      slot.setLabel("Chat Endpoint URL");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    {
      const slot = this.newSlot("chatStreamEndpoint", null);
      //slot.setInspectorPath("");
      slot.setLabel("Chat Stream Endpoint URL");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    {
      const slot = this.newSlot("apiKey", "")
      //slot.setInspectorPath("")
      slot.setLabel("API Key")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    /*
    {
      const slot = this.newSlot("models", null)
      //slot.setFinalInitProto(OpenAiModels)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(false);
    }
    */

    {
      const slot = this.newSlot("conversations", null)
      //slot.setFinalInitProto(OpenAiConversations)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }

    {
      const slot = this.newSlot("imagesPrompts", null)
      //slot.setFinalInitProto(OpenAiImagePrompts)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(false);
    }

    {
      const slot = this.newSlot("ttsSessions", null)
      //slot.setFinalInitProto(OpenAiTtsSessions)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(false);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit()
    this.setTitle("AI Service");
    this.setSubtitle("services");

    // subclasses should set these
    /*
    this.setChatModel("gpt-4-turbo-preview");
    this.setChatEndpoint("https://api.openai.com/v1/chat/completions");
    this.setChatStreamEndpoint("https://api.openai.com/v1/chat/completions");
    */
  }

  validateKey (s) {
    return s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey() && this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

}.initThisClass());
