

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
        this.setNodeSubtitleIsChildrenSummary(true);
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

    onImageGenStatus (statusMessage) {
        console.log(this.logPrefix(), "onImageGenStatus('", statusMessage, "')");
        this.notifyOwners("imageGenStatus", this.status());
    }

    evaluatedCount () {
        return this.subnodes().filter(node => node.status() === "evaluated").length;
    }

    errorCount () {
        return this.subnodes().filter(node => node.error()).length;
    }

    status () {
        // return a string like "Evaluated 3 of 4 images"
        let s = `Evaluated ${this.evaluatedCount()} of ${this.subnodes().length} images`;
        if (this.errorCount() > 0) {
            s += `, ${this.errorCount()} errors`;
        }
        return s;
    }

}.initThisClass());
