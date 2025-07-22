/**
 * @module library.app
 * @class SvSettingsNode
 * @extends SvStorableNode
 * @classdesc Represents a settings node in the application.
 */
"use strict";

(class SvSettingsNode extends SvStorableNode {
    /**
     * Initializes the prototype slots for the settings node.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            this.addSubnodeSlot("prototypes", SvNode);
        }

        {
            this.addSubnodeSlot("resources", SvResources);
        }

        {
            this.addSubnodeSlot("storage", SvDataStore);
        }

        {
            this.addSubnodeSlot("blobs", SvBlobs);
        }
    }

    /**
     * Adds a subnode slot with the given name and prototype.
     * @param {string} slotName - The name of the slot.
     * @param {Object} proto - The prototype for the subnode.
     * @returns {Object} The added slot.
     * @category Configuration
     */
    addSubnodeSlot (slotName, proto) {
        const slot = this.newSlot(slotName, null);
        slot.setShouldStoreSlot(false);
        slot.setFinalInitProto(proto);
        slot.setIsSubnode(true);
        debugger;
        return slot;
    }

    /**
     * Initializes the prototype for the settings node.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanReorderSubnodes(false);
        this.setNodeCanAddSubnode(true);

        // settings are effectively a global node that references other globals
        // so we don't need to store it (for now)

        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
    }

}.initThisClass());