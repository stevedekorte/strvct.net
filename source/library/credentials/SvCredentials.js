"use strict";

/**
 * @module library.app
 * @class SvCredentials
 * @extends BMSummaryNode
 * @classdesc A shared global object to manage passwords.
 * Used by Service APIs. Examples:
 * 
 * const bearerToken = SvCredentialManager.shared().bearerTokenForService("OpenAI");
 * const bearerToken = SvCredentialManager.shared().bearerTokenForEndpoint("https://api.openai.com/v1/chat/completions");
 * 
 */

(class SvCredentials extends BMSummaryNode {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {

    }

    initPrototype () {
        this.setShouldStore(true);
        this.setNodeCanReorderSubnodes(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
        this.setSubnodeClasses([SvCredential]);
    }

}.initThisClass());