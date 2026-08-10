/**
 * @module library.services.Krea.Text_to_Image
 */

/**
 * @class SvKreaImagePrompts
 * @extends SvJsonArrayNode
 * @classdesc A collection of Krea image prompts.
 */
"use strict";

(class SvKreaImagePrompts extends SvJsonArrayNode {

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setCanDelete(false);
        this.setSubnodeClasses([SvKreaImagePrompt]);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("Image Prompts");
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

}.initThisClass());
