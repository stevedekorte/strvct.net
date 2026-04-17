/**
 * @module library.services.ImaginePro.Image_Eval_Prompts
 */

/**
 * @class SvImagineProImageEvalPrompts
 * @extends SvImagineProImagePrompts
 * @classdesc A collection of ImaginePro image eval prompts.
 */
"use strict";

(class SvImagineProImageEvalPrompts extends SvImagineProImagePrompts {

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setSubnodeClasses([SvImagineProImageEvalPrompt]);
        this.setTitle("Image Eval Prompts");
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }

}.initThisClass());
