"use strict";

/**
 * @module library.services.ImaginePro.TextToImage
 */

/**
 * @interface SvImagineProImageGenerationDelegateProtocol
 * @extends SvDelegateProtocol
 * @classdesc What an image generation job tells its delegate. Sent by SvImagineProImageGeneration (sendDelegateMessage); every message is
 * optional. Written from the sends in SvImagineProImageGeneration — when it sends a new message,
 * add it here (the delegate-message tripwire and TestDelegateProtocols say so).
 */
(class SvImagineProImageGenerationDelegateProtocol extends SvDelegateProtocol {

    /**
     * @description The job started.
     * @param {SvImagineProImageGeneration} generation - The job.
     * @category Delegation
     */
    onImageGenerationStart (generation) {
    }

    /**
     * @description The job failed.
     * @param {SvImagineProImageGeneration} generation - The job (its error says what went wrong).
     * @category Delegation
     */
    onImageGenerationError (generation) {
    }

}.initThisProtocol());
