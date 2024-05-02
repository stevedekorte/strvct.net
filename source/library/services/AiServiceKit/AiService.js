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

    /*
    {
      const slot = this.newSlot("chatModel", null);
      //slot.setInspectorPath("");
      slot.setLabel("Chat Model");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(true);
      slot.setFinalInitProto(AiChatModel)
    }
    */

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


    {
      const slot = this.newSlot("models", null)
      slot.setFinalInitProto(BMSummaryNode)
      slot.setShouldStoreSlot(true); // will need to sync when loading from json
      slot.setIsSubnode(true);
    }

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

    /*
    // add a default model, in case there are no models
    if (this.models().subnodeCount() === 0) {
      this.models().addSubnode(AiChatModel.clone());
    }
    */

    this.fetchAndSetupInfo(); // can't just cache this as key or models may have changed
  }

  defaultChatModel () {
    return this.models().subnodes().first(); // first model is the default
  }

  validateKey (s) {
    return s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey() && this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  defaultChatModelName () {
    return this.defaultChatModel().modelName();
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

    if (info.defaultChatModelName) {
      this.defaultChatModel().setModelName(info.defaultChatModelName);
    }

    if (info.contextWindow) {
      this.defaultChatModel().setMaxContextTokenCount(info.contextWindow);
    }

    if (info.models) {
      this.models().removeAllSubnodes();
      info.models.forEach(modelInfo => {
        const model = AiChatModel.clone().setJson(modelInfo);
        this.models().addSubnode(model);
      });
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

  chatRequestClass () {
    // compose the class name from the service name e.g. AnthropicService -> AnthropicRequest 
    const className = this.type().split("Service")[0] + "Request";
    const requestClass = getGlobalThis()[className];
    if (!requestClass) {
      throw new Error("chatRequestClass " + className + " not found");
    }
    return requestClass;
  }

}.initThisClass());
