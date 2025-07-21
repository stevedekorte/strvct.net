"use strict";

/*
    @class SvUserInterface
    @extends SvStorableNode
    @classdesc The SvUserInterface class is the main user interface class of the SvApp.

*/

(class SvUserInterface extends SvStorableNode {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanReorderSubnodes(false);
    }

    init () {
        super.init();
        //WebDocument.shared().setTitle(this.app().name());

        // Register for window errors
        //WindowErrorPanel.shared().registerForWindowErrors();
        return this;
    }

    async afterAppUiDidInit () {
        return this;
    }

    async setup () {
        return this;
    }

}.initThisClass());
