"use strict";

/**
 * @module library.app
 * @class CredentialManager
 * @extends SvSummaryNode
 * @classdesc A shared global object to manage passwords.
 * Used by Service APIs. Examples:
 * 
 * SvCredentialManager.shared().setUserAuthToken("..."); // set the user auth token for the current user
 * 
 * const bearerToken = SvCredentialManager.shared().bearerTokenForService("OpenAI");
 * const bearerToken = SvCredentialManager.shared().bearerTokenForEndpoint("https://api.openai.com/v1/chat/completions");
 * 
 */


(class SvCredentialManager extends SvSummaryNode {

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

    // Return fresh Firebase ID token for API authentication

    async bearerTokenForService (/*serviceName*/) {
      // Get fresh Firebase ID token
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
          try {
            return await user.getIdToken();
          } catch (error) {
            console.error("Failed to get Firebase ID token:", error);
            return null;
          }
        }
      }
      return null;
    }
    
    async bearerTokenForEndpoint (/*endpoint*/) {
        // Get fresh Firebase ID token
        if (typeof firebase !== 'undefined' && firebase.auth) {
          const user = firebase.auth().currentUser;
          if (user) {
            try {
              return await user.getIdToken();
            } catch (error) {
              console.error("Failed to get Firebase ID token:", error);
              return null;
            }
          }
        }
        return null;
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