

/**
 * @class ImageEvaluators
 * @extends SvSummaryNode
 * @classdesc A collection of Image Evaluators.
 */
"use strict";

(class ImageEvaluators extends SvSummaryNode {

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

    this.setSubnodeClasses([ImageEvaluator]);
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
    this.setTitle("Image Evaluators");
  }

  async asyncEvaluate () {
    const promises = this.subnodes().map(node => node.asyncEvaluate());
    await Promise.all(promises);
  }

  bestSvImage () {
    const bestEvaluator = this.subnodes().reduce((best, node) => {
      return node.score() > best.score() ? node : best;
    }, this.subnodes()[0]);
    return bestEvaluator.svImage();
  }

  bestImageIndex () {
    const bestEvaluator = this.subnodes().reduce((best, node) => {
      return node.score() > best.score() ? node : best;
    }, this.subnodes()[0]);
    return this.subnodes().indexOf(bestEvaluator);
  }

}.initThisClass());