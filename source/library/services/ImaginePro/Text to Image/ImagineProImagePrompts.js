/**
 * @module library.services.ImaginePro.Text_to_Image
 */

/**
 * @class ImagineProImagePrompts
 * @extends SvJsonArrayNode
 * @classdesc A collection of ImaginePro image prompts.
 */
"use strict";

(class ImagineProImagePrompts extends SvJsonArrayNode {
    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setCanDelete(false);
        this.setSubnodeClasses([ImagineProImagePrompt]);
        this.setNodeCanReorderSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Image Prompts");
    }

}.initThisClass());
