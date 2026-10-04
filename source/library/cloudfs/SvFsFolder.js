"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsFolder
 * @extends SvFsNode
 * @classdesc
 * A folder node: a scope root (the account's home, a multiplayer
 * session's scope). Its contents are records placed in the scope
 * (SvCloudRecordStore.asyncScopeRootRows), not child nodes.
 */

(class SvFsFolder extends SvFsNode {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
    }

    initPrototype () {
    }

    init () {
        super.init();
        return this;
    }

}.initThisClass());
