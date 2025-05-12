"use strict";

/**
 * @module library.credentials
 * @class SvCredential
 * @extends BMSummaryNode
 * @classdesc An individual credential for a service.
 * 
 */


(class SvCredential extends BMSummaryNode {

  initPrototypeSlots () {
    {
      const slot = this.newSlot("serviceName", null);
      slot.setShouldStoreSlot(true);
      slot.setSlotType("String");
      slot.setIsSubnode(true);
    }

    {
        const slot = this.newSlot("userName", null);
        slot.setShouldStoreSlot(true);
        slot.setSlotType("String");
        slot.setIsSubnode(true);
    } 

    {
        const slot = this.newSlot("password", null);
        slot.setShouldStoreSlot(true);
        slot.setSlotType("String");
        slot.setIsSubnode(true);
    } 
  }

  initPrototype () {
      this.setShouldStore(true);
      this.setNodeCanReorderSubnodes(false);
      this.setShouldStoreSubnodes(false);
      this.setNodeCanAddSubnode(false);
  }

  fetchInfoUrl () {
    const baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
    const url = baseUrl + "/app/info/" + this.serviceName() + ".json";
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