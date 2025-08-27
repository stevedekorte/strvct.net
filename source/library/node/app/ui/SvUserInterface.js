"use strict";

/*
    @class SvUserInterface
    @extends SvStorableNode
    @classdesc The SvUserInterface class is the main user interface class of the SvApp.

*/

(class SvUserInterface extends SvStorableNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("app", null);
            slot.setSlotType("SvApp");
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
    }

    init () {
        super.init();
        return this;
    }

    assertCanRun () {
        // override in subclasses with any checks that need to be done before running
        return true;
    }

    async afterAppDidInit () {
        return this;
    }

    async setup () {
        return this;
    }


}.initThisClass());
