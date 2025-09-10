"use strict";

(class SvImage_evaluator extends SvImage {

    /**
     * @description Scores the image (0.0-1.0) for a given prompt.
     * @param {string} anImageGenPrompt - The prompt to score the image for.
     * @returns {number} The score of the image for the prompt.
     */
    async asyncScoreForPrompt (anImageGenPrompt) {
        const evaluator = ImageEvaluator.clone();
        evaluator.setSvImage(this);
        evaluator.setImageGenPrompt(anImageGenPrompt);
        await evaluator.asyncEvaluate();
        return evaluator.score();
    }

}).initThisCategory();

