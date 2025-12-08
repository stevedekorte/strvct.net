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

}.initThisClass());
