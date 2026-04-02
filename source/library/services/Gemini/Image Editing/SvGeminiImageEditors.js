"use strict";

/**
 * @module library.services.Gemini.Image_Editing
 */

/**
 * @class SvGeminiImageEditors
 * @extends SvSummaryNode
 * @classdesc Collection of SvGeminiImageEditor instances.
 */

(class SvGeminiImageEditors extends SvSummaryNode {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([SvGeminiImageEditor]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("Image Editing");
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

    service () {
        return this.ownerNode();
    }

}.initThisClass());
