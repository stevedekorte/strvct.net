/**
 * @module library.services.ImaginePro.Text_to_Image
 */

/**
 * @class SvImagineProImagePrompts
 * @extends SvJsonArrayNode
 * @classdesc A collection of ImaginePro image prompts.
 */
"use strict";

(class SvImagineProImagePrompts extends SvJsonArrayNode {
    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setCanDelete(false);
        this.setSubnodeClasses([SvImagineProImagePrompt]);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("Image Prompts");
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

}.initThisClass());
