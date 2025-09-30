/**
 * @module library.services.ImaginePro.Image_Eval_Prompts
 */

/**
 * @class ImagineProImageEvalPrompts
 * @extends ImagineProImagePrompts
 * @classdesc A collection of ImaginePro image eval prompts.
 */
"use strict";

(class ImagineProImageEvalPrompts extends ImagineProImagePrompts {

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {
    }

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setSubnodeClasses([ImagineProImageEvalPrompt]);
        this.setTitle("Image Eval Prompts");
    }

}.initThisClass());
