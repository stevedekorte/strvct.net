"use strict";

/**
 * @module library.services.Gemini.Image_Upscaling
 */

/**
 * @class GeminiImageUpscalings
 * @extends SvSummaryNode
 * @classdesc Collection of GeminiImageUpscaling instances.
 */

(class GeminiImageUpscalings extends SvSummaryNode {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([GeminiImageUpscaling]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("Image Upscaling");
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
