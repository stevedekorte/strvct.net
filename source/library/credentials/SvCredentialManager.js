"use strict";

/** * @module library.app
 */

/** * @class CredentialManager
 * @extends SvSummaryNode
 * @classdesc A shared global object to manage passwords.
 * Used by Service APIs. Examples:
 *
 * Typical usage:
 * On startup, the application should set the closure to return the bearer token for the service.
 * SvCredentialManager.shared().setBearerTokenForServiceClosure((serviceName) => { return ...; });
 *
 *
 * Alternatively, you can set the bearer token directly:
 * const credential = SvCredentialManager.shared().credentials().newCredential();
 * credential.setServiceName("OpenAI");
 * credential.setBearerToken("... bearer token ...");
 *
 
 
 */

/**

 */


(class SvCredentialManager extends SvSummaryNode {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {

        {
            const slot = this.newSlot("credentials", null);
            slot.setLabelToCapitalizedSlotName();
            slot.setShouldStoreSlot(true);
            slot.setFinalInitProto(SvCredentials);
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

    async bearerTokenForService (serviceName) {
        const closure = this.bearerTokenForServiceClosure();
        if (closure) {
            return await closure();
        }

        const credential = this.credentials().credentialForService(serviceName);
        if (credential) {
            return credential.bearerToken();
        }

        throw new Error("No bearer token found for service: " + serviceName);
    }

    async bearerTokenForEndpoint (endpoint) {
        // note: endpoint matching might be tricky with services like Gemini

        const closure = this.bearerTokenForEndpointClosure();
        if (closure) {
            return await closure();
        }

        const credential = this.credentials().credentialForEndpoint(endpoint);
        if (credential) {
            return credential.bearerToken();
        }

        throw new Error("No bearer token found for endpoint: " + endpoint);
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
