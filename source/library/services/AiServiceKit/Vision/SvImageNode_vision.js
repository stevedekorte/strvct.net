"use strict";

/**
 * @module library.services.AiServiceKit.Vision
 */

/**
 * @class SvImageNode_vision
 * @extends SvImageNode
 * @classdesc An image node can be looked at: a vision model describes it, or
 * answers a question about it (SvVisionQuery).
 */
(class SvImageNode_vision extends SvImageNode {

    /**
     * @description A literal, count-first description of the image.
     * @returns {Promise<String>}
     * @category Vision
     */
    async asyncDescription () {
        return await SvVisionQuery.describing(await this.asyncDataUrlForVision()).asyncAnswer();
    }

    /**
     * @description The answer to one question about the image.
     * @param {String} question
     * @returns {Promise<String>}
     * @category Vision
     */
    async asyncAnswerTo (question) {
        return await SvVisionQuery.asking(await this.asyncDataUrlForVision(), question).asyncAnswer();
    }

    async asyncDataUrlForVision () {
        const dataUrl = await this.asyncDataUrl();
        if (!dataUrl) {
            throw new Error("the image has no bytes yet");
        }
        return dataUrl;
    }

}.initThisCategory());
