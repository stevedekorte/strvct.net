/**
 * @module library.services.ImaginePro.Text_to_Image
 */

/**
 * @class ImagineProImageGenerations
 * @extends SvJsonArrayNode
 * @classdesc A collection of ImaginePro image generation tasks.
 */
"use strict";

(class ImagineProImageGenerations extends SvJsonArrayNode {

  /**
   * @description Initializes the prototype.
   * @category Initialization
   */
  initPrototype () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setCanDelete(false);
    this.setSubnodeClasses([ImagineProImageGeneration]);
    this.setNodeCanAddSubnode(false);
    this.setNodeCanReorderSubnodes(false);
  }

  /**
   * @description Performs final initialization.
   * @category Initialization
   */
  finalInit () {
    super.finalInit();
    this.setTitle("generations");
  }

  /**
   * @description Creates a new generation.
   * @returns {ImagineProImageGeneration} The new generation.
   * @category Creation
   */
  add () {
    const generation = ImagineProImageGeneration.clone();
    this.addSubnode(generation);
    return generation;
  }

}.initThisClass());