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
      const slot = this.newSlot("serviceInfo", null);
      //slot.setInspectorPath("");
      slot.setLabel("info");
      slot.setShouldStoreSlot(false);
      slot.setDuplicateOp("duplicate");
      //slot.setSlotType("String");
      slot.setIsSubnodeField(false);

      //slot.setValidValues(values);
    }

    {
      const slot = this.newSlot("chatModel", null);
      //slot.setInspectorPath("");
      slot.setLabel("Chat Model");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setFinalInitProto(AiChatModel)

      //slot.setValidValues(values);
    }

    /*
    {
      const slot = this.newSlot("chatModels", null)
      slot.setFinalInitProto(AiChatModels)
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
    }
    */

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
      const slot = this.newSlot("apiKey", "")
      //slot.setInspectorPath("")
      slot.setLabel("API Key")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

      // Role names

      {
        const slot = this.newSlot("systemRoleName", "system"); 
      }
  
      {
        const slot = this.newSlot("assistantRoleName", "assistant"); 
      }
  
      {
        const slot = this.newSlot("userRoleName", "user"); 
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
      slot.setFinalInitProto(AiConversations)
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
    this.setSubtitle("ai services");

    // subclasses should set these
    /*
    this.setChatEndpoint("https://api.openai.com/v1/chat/completions");
    this.chatModel().setModelName("claude-3-opus-20240229");
    this.chatModel().setMaxContextTokenCount(200000); // base level 
    */

   //if (!this.hasApiKey()) {
      this.fetchAndSetupInfo(); // key may have changed
    //}
  }

  validateKey (s) {
    return s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey() && this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  chatModelName () {
    return this.chatModel().modelName();
  }

  serviceRoleNameForRole (role) {
    if (role === "system") {
      return this.systemRoleName();
    }

    if (role === "assistant") {
      return this.assistantRoleName();
    }

    if (role === "user") {
      return this.userRoleName();
    }

    throw new Error("unknown role " + role);
    return role;
  }

  prepareToSendRequest (aRequest) {
    // subclasses should override
    return this;
  }

  async fetchAndSetupInfo () {
    let info;

    try {
      info = await this.fetchInfo();
      this.setServiceInfo(info);
      this.setupFromInfo();
    } catch (error) {
      console.log(this.type() + ".fetchAndSetupInfo() [" + this.fetchInfoUrl() + " error: ", error);
      return;
    }
  }

  setupFromInfo () {
    const info = this.serviceInfo();

    if (info.apiKey) {
      this.setApiKey(info.apiKey);
    }

    if (info.chatEndpoint) {
      this.setChatEndpoint(info.chatEndpoint);
    }

    if (info.chatModelName) {
      this.chatModel().setModelName(info.chatModelName);
    }

    if (info.chatModelMaxContextTokenCount) {
      this.chatModel().setMaxContextTokenCount(info.chatModelMaxContextTokenCount);
    }
  }

  fetchInfoUrl () {
    const baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
    const url = baseUrl + "/app/info/" + this.type() + ".json";
    return url;
  }

  async fetchInfo () {
    return fetch(this.fetchInfoUrl())
      .then(response => response.json())
      .then(json => {
        //console.log("info response", json);
        return json;
      });
  }

}.initThisClass());
