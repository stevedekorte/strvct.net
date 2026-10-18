"use strict";

/**
 * @module library.services.ImaginePro.TextToImage
 */

/**
 * @class SvImageGenerationDelegateProtocol
 * @extends Protocol
 * @classdesc Delegate protocol for AI image generation lifecycle events and data URL callbacks.
 */

(class SvImageGenerationDelegateProtocol extends Protocol {

    /**
     * @description Handles the start of an image generation job.
     * @param {Object} imagePrompt - The image prompt instance.
     */
    onImageGenerationBegin (imagePrompt) {
    }

    /**
     * @description Handles fetched data URL strings for generated images.
     * @param {string} dataUrl - The fetched image data URL string.
     */
    didFetchDataUrl (dataUrl) {
    }

    /**
     * @description Handles successful instantiation of a generated image node.
     * @param {Object} imageNode - The generated image node instance.
     */
    onImageGenerated (imageNode) {
    }

    /**
     * @description Handles image generation job failure.
     * @param {Object} imagePrompt - The image prompt instance.
     * @param {Error} error - Generation error instance.
     */
    onImageGenerationFailure (imagePrompt, error) {
    }

}.initThisProtocol());
