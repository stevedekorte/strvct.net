"use strict";

/*

    @class SvActorMessages

*/

(class SvActorMessages extends BaseNode {

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([SvActorMessage]);
    }

    firstUnsentMessage () {
        return this.subnodes().detect((sn) => !sn.isSent());
    }

    firstPendingMessage () {
        return this.subnodes().detect((sn) => sn.isPending());
    }

    hasPendingMessage () {
        return this.firstPendingMessage() === undefined;
    }

    removeAnyPendingMessage () {
        const m = this.firstPendingMessage();
        this.removeSubnode(m);
    }

}.initThisClass());
