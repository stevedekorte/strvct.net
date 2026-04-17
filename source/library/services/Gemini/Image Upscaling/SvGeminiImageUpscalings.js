"use strict";

/**
 * @module library.services.Gemini.Image_Upscaling
 */

/**
 * @class SvGeminiImageUpscalings
 * @extends SvSummaryNode
 * @classdesc Collection of GeminiImageUpscaling instances.
 */

(class SvGeminiImageUpscalings extends SvSummaryNode {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([SvGeminiImageScaler]);
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
