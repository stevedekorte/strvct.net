"use strict";

/**
 * @module library.app
 * @class SvCredentials
 * @extends SvSummaryNode
 * @classdesc A collection of credentials for a service.
 *
 */

(class SvCredentials extends SvSummaryNode {

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

    credentialForService (serviceName) {
        return this.subnodes().find(credential => credential.serviceName() === serviceName);
    }

    credentialForEndpoint (endpoint) {
        return this.subnodes().find(credential => credential.endpoint().beginsWith(endpoint));
    }

}.initThisClass());
