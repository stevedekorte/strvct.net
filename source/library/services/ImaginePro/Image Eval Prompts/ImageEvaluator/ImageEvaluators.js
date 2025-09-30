

/**
 * @class ImageEvaluators
 * @extends SvSummaryNode
 * @classdesc A collection of Image Evaluators.
 */
"use strict";

(class ImageEvaluators extends SvSummaryNode {

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
        this.setTitle("Image Evaluators");
    }

    async asyncEvaluate () {
        const promises = this.subnodes().map(node => node.asyncEvaluate());
        await Promise.all(promises);
    }

    bestEvaluator () {
        return this.subnodes().reduce((best, node) => {
            return node.score() > best.score() ? node : best;
        }, this.subnodes()[0]);
    }

    bestSvImage () {
        const bestEvaluator = this.bestEvaluator();
        return bestEvaluator ? bestEvaluator.svImage() : null;
    }

    bestImageIndex () {
        const bestEvaluator = this.bestEvaluator();
        return bestEvaluator ? this.subnodes().indexOf(bestEvaluator) : null;
    }

}.initThisClass());
