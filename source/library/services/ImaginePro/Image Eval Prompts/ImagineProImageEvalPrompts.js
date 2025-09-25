/**
 * @module library.services.ImaginePro.Image_Eval_Prompts
 */

/**
 * @class ImagineProImageEvalPrompts
 * @extends SvJsonArrayNode
 * @classdesc A collection of ImaginePro image eval prompts.
 */
"use strict";

(class ImagineProImageEvalPrompts extends SvJsonArrayNode {

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
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setCanDelete(false);

    this.setSubnodeClasses([ImagineProImageEvalPrompt]);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(false);
  }

  /**
   * @description Initializes the instance.
   * @category Initialization
   */
  init () {
    super.init();
  }

  /**
   * @description Performs final initialization.
   * @category Initialization
   */
  finalInit () {
    super.finalInit();
    this.setTitle("Image Eval Prompts");
  }


}.initThisClass());