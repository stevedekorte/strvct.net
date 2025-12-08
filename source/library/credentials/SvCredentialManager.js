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
        /*
        {
            const slot = this.newSlot("userAuthToken", "");
            slot.setLabelToCapitalizedSlotName();
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setAllowsNullValue(true);
        }
        */

        {
            const slot = this.newSlot("credentials", null);
            slot.setLabelToCapitalizedSlotName();
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(SvCredential);
            slot.setIsSubnode(true);
        }

        {
            const slot = this.newSlot("bearerTokenForServiceClosure", null);
            slot.setSlotType("Function");
        }

        {
            const slot = this.newSlot("bearerTokenForEndpointClosure", null);
            slot.setSlotType("Function");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setNodeCanReorderSubnodes(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
        this.setSubnodeClasses([SvCredential]);
    }

    // Return fresh Firebase ID token for API authentication

    async bearerTokenForService (/*serviceName*/) {
        const closure = this.bearerTokenForServiceClosure();
        if (closure) {
            return await closure();
        }
        throw new Error("bearerTokenForServiceClosure is not set");
    }

    async bearerTokenForEndpoint (/*endpoint*/) {
        const closure = this.bearerTokenForEndpointClosure();
        if (closure) {
            return await closure();
        }
        throw new Error("bearerTokenForEndpointClosure is not set");
    }

    /*
    fetchInfoUrl () {
        debugger;
        const baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
        const url = baseUrl + "/app/info/" + this.svType() + ".json";
        return url;
    }

    async fetchInfo () {
        debugger;
        return fetch(this.fetchInfoUrl())
            .then(response => response.json())
            .then(json => {
                return json;
            });
    }
    */

}.initThisClass());
