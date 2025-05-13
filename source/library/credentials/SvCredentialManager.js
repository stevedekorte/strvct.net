"use strict";

/**
 * @module library.app
 * @class CredentialManager
 * @extends BMSummaryNode
 * @classdesc A shared global object to manage passwords.
 * Used by Service APIs. Examples:
 * 
 * const bearerToken = SvCredentialManager.shared().bearerTokenForService("OpenAI");
 * const bearerToken = SvCredentialManager.shared().bearerTokenForEndpoint("https://api.openai.com/v1/chat/completions");
 * 
 */


(class SvCredentialManager extends BMSummaryNode {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("userAuthToken", "");
            slot.setLabelToCapitalizedSlotName();
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setAllowsNullValue(true);
        }

        {
            const slot = this.newSlot("credentials", null);
            slot.setLabelToCapitalizedSlotName();
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(SvCredential);
            slot.setIsSubnode(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setNodeCanReorderSubnodes(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
        this.setSubnodeClasses([SvCredential]);
    }

    finalInit () {
      this.setUserAuthToken("");
      super.finalInit();
    }

    // these implementations are temporary - will be replaced with actual implementations

    bearerTokenForService (serviceName) {
        return this.userAuthToken();
    }
    
    bearerTokenForEndpoint (endpoint) {
        return this.userAuthToken();
    }

    /*==
    /**
   * @description Returns the URL for fetching service information.
   * @returns {string} The URL for fetching service information.
   * @category Service Information
   */
  fetchInfoUrl () {
    const baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
    const url = baseUrl + "/app/info/" + this.type() + ".json";
    return url;
  }

  /**
   * @description Fetches the service information.
   * @returns {Promise<Object>} A promise that resolves to the service information.
   * @category Service Information
   */
  async fetchInfo () {
    return fetch(this.fetchInfoUrl())
      .then(response => response.json())
      .then(json => {
        return json;
      });
  }

}.initThisClass());