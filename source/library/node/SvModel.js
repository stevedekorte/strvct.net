"use strict";

/*
    @class SvModel
    @extends SvStorableNode
    @classdesc The SvModel class is the main model class of the SvApp.

*/

(class SvModel extends SvStorableNode {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.setNodeTileClassName("BreadCrumbsTile");
    }

    async afterAppUiDidInit () {
        return this;
    }

    async setup () {
        return this;
    }

}.initThisClass());
