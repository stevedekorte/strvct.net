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

    this.setSubnodeClasses([ImagineProImagePrompt]);
    //this.setSubnodeClasses([ImagineProImagePrompt, ImagineProImageEvalPrompt]);
    //this.setNodeCanAddSubnode(true);
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
    this.setTitle("image prompts");
  }

  /**
   * @description Creates a new image prompt.
   * @returns {ImagineProImagePrompt} The new image prompt.
   * @category Creation
   */
  add () {
    const prompt = ImagineProImagePrompt.clone();
    this.addSubnode(prompt);
    return prompt;
  }

}.initThisClass());