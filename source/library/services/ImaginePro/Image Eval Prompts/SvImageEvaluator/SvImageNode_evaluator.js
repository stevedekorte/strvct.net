"use strict";

/**
 * @class SvImageNode_evaluator
 * @extends SvImageNode
 * @classdesc Category of SvImageNode adding prompt-based image scoring via SvImageEvaluator.
 */

(class SvImageNode_evaluator extends SvImageNode {

    /**
     * @description Scores the image (0.0-1.0) for a given prompt.
     * @param {string} anImageGenPrompt - The prompt to score the image for.
     * @returns {number} The score of the image for the prompt.
     */
    async asyncScoreForPrompt (anImageGenPrompt) {
        const evaluator = SvImageEvaluator.clone();
        evaluator.setSvImage(this);
        evaluator.setImageGenPrompt(anImageGenPrompt);
        await evaluator.asyncEvaluate();
        return evaluator.score();
    }

}).initThisCategory();
