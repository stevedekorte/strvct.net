"use strict";

/**
 * @module library.services.AiServiceKit
 */

/**
 * @class AiService
 * @extends BMSummaryNode
 * @classdesc A BMSummaryNode that holds the API key and subnodes related to the service.
 * 
 * Example:
 * 
 * AiService.shared().setApiKey("sk-1234567890");
 * const hasApiKey = AiService.shared().hasApiKey();
 */
(class AiService extends BMSummaryNode {

  /**
   * @description Returns an array of model information.
   * @returns {Array} An array of model information.
   */
  modelsJson () {
    return [];
  }

  /**
   * @description Initializes the prototype slots for the AiService.
   */
  initPrototypeSlots () {

    /**
     * @member {Object} serviceInfo - Information about the service.
     */
    {
      const slot = this.newSlot("serviceInfo", null);
      slot.setLabel("info");
      slot.setShouldStoreSlot(false);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("JSON Object");
      slot.setIsSubnodeField(false);
    }

    /**
     * @member {string} chatEndpoint - The URL endpoint for chat.
     */
    {
      const slot = this.newSlot("chatEndpoint", null);
      slot.setLabel("Chat Endpoint URL");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {string} apiKey - The API key for the service.
     */
    {
      const slot = this.newSlot("apiKey", "")
      slot.setLabel("API Key")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    /**
     * @member {string} systemRoleName - The name of the system role.
     */
    {
      const slot = this.newSlot("systemRoleName", "system");
      slot.setSlotType("String");
    }

    /**
     * @member {string} assistantRoleName - The name of the assistant role.
     */
    {
      const slot = this.newSlot("assistantRoleName", "assistant");
      slot.setSlotType("String");
    }

    /**
     * @member {string} userRoleName - The name of the user role.
     */
    {
      const slot = this.newSlot("userRoleName", "user");
      slot.setSlotType("String");
    }

    /**
     * @member {AiChatModels} models - The AI chat models.
     */
    {
      const slot = this.newSlot("models", null);
      slot.setFinalInitProto(AiChatModels);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("AiChatModels");
    }

    /**
     * @member {AiConversations} conversations - The AI conversations.
     */
    {
      const slot = this.newSlot("conversations", null);
      slot.setFinalInitProto(AiConversations);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(true);
      slot.setSlotType("AiConversations");
    }

    /**
     * @member {OpenAiImagePrompts} imagesPrompts - The OpenAI image prompts.
     */
    {
      const slot = this.newSlot("imagesPrompts", null);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(false);
      slot.setSlotType("OpenAiImagePrompts");
    }

    /**
     * @member {OpenAiTtsSessions} ttsSessions - The OpenAI TTS sessions.
     */
    {
      const slot = this.newSlot("ttsSessions", null);
      slot.setShouldStoreSlot(true);
      slot.setIsSubnode(false);
      slot.setSlotType("OpenAiTtsSessions");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the AiService.
   */
  init () {
    super.init();
  }

  /**
   * @description Performs final initialization of the AiService.
   */
  finalInit () {
    super.finalInit()
    this.setTitle("AI Service");
    this.setSubtitle("ai services");
    this.setModels(AiChatModels.clone());
    this.setModelsJson(this.modelsJson());

    this.fetchAndSetupInfo();
  }

  /**
   * @description Returns the default chat model.
   * @returns {AiChatModel} The default chat model.
   */
  defaultChatModel () {
    return this.models().subnodes().first();
  }

  /**
   * @description Validates the API key.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the API key is valid, false otherwise.
   */
  validateKey (s) {
    return s.startsWith("sk-");
  }

  /**
   * @description Checks if the API key is set and valid.
   * @returns {boolean} True if the API key is set and valid, false otherwise.
   */
  hasApiKey () {
    return this.apiKey() && this.apiKey().length > 0 && this.validateKey(this.apiKey());
  }

  /**
   * @description Returns the name of the default chat model.
   * @returns {string} The name of the default chat model.
   */
  defaultChatModelName () {
    return this.defaultChatModel().modelName();
  }

  /**
   * @description Returns the service-specific role name for a given role.
   * @param {string} role - The role to get the service-specific name for.
   * @returns {string} The service-specific role name.
   * @throws {Error} If the role is unknown.
   */
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
  }

  /**
   * @description Prepares the service to send a request.
   * @param {Object} aRequest - The request to prepare.
   * @returns {AiService} The AiService instance.
   */
  prepareToSendRequest (aRequest) {
    return this;
  }

  /**
   * @description Fetches and sets up the service information.
   * @returns {Promise<void>}
   */
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

  /**
   * @description Sets up the service from the fetched information.
   */
  setupFromInfo () {
    const info = this.serviceInfo();

    if (info.apiKey) {
      this.setApiKey(info.apiKey);
    }

    if (info.chatEndpoint) {
      this.setChatEndpoint(info.chatEndpoint);
    }

    if (info.models) {
      this.setModelsJson(info.models);
    }
  }

  /**
   * @description Sets up the models from JSON data.
   * @param {Array} json - The JSON data containing model information.
   * @returns {AiService} The AiService instance.
   */
  setModelsJson (json) {
    this.models().removeAllSubnodes();
    json.forEach(modelInfo => {
      const model = AiChatModel.clone().setJson(modelInfo).setService(this);
      this.models().addSubnode(model);
    });
    return this;
  }

  /**
   * @description Returns the URL for fetching service information.
   * @returns {string} The URL for fetching service information.
   */
  fetchInfoUrl () {
    const baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
    const url = baseUrl + "/app/info/" + this.type() + ".json";
    return url;
  }

  /**
   * @description Fetches the service information.
   * @returns {Promise<Object>} A promise that resolves to the service information.
   */
  async fetchInfo () {
    return fetch(this.fetchInfoUrl())
      .then(response => response.json())
      .then(json => {
        return json;
      });
  }

  /**
   * @description Returns the chat request class for the service.
   * @returns {Function} The chat request class.
   * @throws {Error} If the chat request class is not found.
   */
  chatRequestClass () {
    const className = this.type().split("Service")[0] + "Request";
    const requestClass = getGlobalThis()[className];
    if (!requestClass) {
      throw new Error("chatRequestClass " + className + " not found");
    }
    return requestClass;
  }

}.initThisClass());