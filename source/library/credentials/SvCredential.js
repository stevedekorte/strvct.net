"use strict";

/**
 * @module library.credentials
 * @class SvCredential
 * @extends SvSummaryNode
 * @classdesc An individual credential for a service.
 *
 */


(class SvCredential extends SvSummaryNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("serviceName", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("userName", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("password", "");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
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
