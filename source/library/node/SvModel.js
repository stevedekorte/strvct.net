"use strict";

/*
    @class SvModel
    @extends SvStorableNode
    @classdesc The SvModel class is the main model class of the SvApp.

*/

(class SvModel extends SvStorableNode {

    initPrototypeSlots () {
        {
            /**
             * @member {SvCoachMarkManager} coachMarkManager - Manager for coach marks
             * @category UI
             */
            const slot = this.newSlot("coachMarkManager", null);
            slot.setSlotType("SvCoachMarkManager");
            slot.setFinalInitProto(SvCoachMarkManager);
            slot.setShouldStoreSlot(true);
        }
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
