/**
 * @module library.services.Leonardo.RefImages
 */

"use strict";

/**
 * @class LeonardoRefImages
 * @extends SvSummaryNode
 * @classdesc Represents a collection of Leonardo generated images.
 * 
 * 
 */

(class LeonardoRefImages extends SvSummaryNode {

  /**
   * @description Initializes the prototype.
   * @category Initialization
   */
  initPrototype () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([LeonardoRefImage]);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setTitle("Reference Images");
    this.setNoteIsSubnodeCount(true);
  }

  finalInit () {
    super.finalInit();
    this.initPrototype();
  }

}.initThisClass());