/**
 * @module library.services.ImaginePro.Image_Eval_Prompts
 */

/**
 * @class SvImagineProImageEvalPrompt
 * @extends SvImagineProImagePrompt
 * @classdesc An ImaginePro image eval prompt that generates images and evaluates them with Gemini.
 *
 * How it works:
 * 1. Generates images using the parent SvImagineProImagePrompt parent class
 * 2. Uses SvImageEvaluators to evaluate how well each image matches the prompt
 * 3. Selects and stores the best matching image in resultImageUrlData slot
 */
"use strict";

(class SvImagineProImageEvalPrompt extends SvImagineProImagePrompt {

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("imageEvaluators", null);
            slot.setFinalInitProto(SvImageEvaluators);
            slot.setLabel("Images Evaluations");
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        // Result image node (the best matching image) - blob-backed, no data URL round-trip
        {
            const slot = this.newSlot("resultImageNode", null);
            slot.setSlotType("SvImageNode");
            slot.setLabel("Best Result Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false); // transient; consumers copy the blob directly
            slot.setSyncsToView(true);
            slot.setFieldInspectorClassName("SvImageWellField");
            slot.setCanEditInspection(false);
        }

        // shouldEval slot
        {
            const slot = this.newSlot("shouldEval", true);
            slot.setSlotType("Boolean");
            slot.setLabel("Should Eval");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
        }

        // Remove white/black borders from generated images before they are
        // evaluated, so a bordered-but-strong image competes on its actual
        // content (and the stored best image is the cropped one).
        {
            const slot = this.newSlot("shouldRemoveBorders", true);
            slot.setSlotType("Boolean");
            slot.setLabel("Remove Borders");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
        }

        {
            const slot = this.newSlot("evaluateAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Evaluate");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncEvaluateImages");
        }

        // onPromptEnd action
        {
            const slot = this.newSlot("onPromptEndAction", null);
            slot.setInspectorPath("");
            slot.setLabel("On Prompt End");
            slot.setSyncsToView(true);
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("onPromptEnd");
        }

    }

    /**
   * @description Override title to show it's an eval prompt.
   * @returns {string} The title.
   * @category Metadata
   */
    title () {
        const p = this.prompt().clipWithEllipsis(15);
        return p ? p : "Image Eval Prompt";
    }

    /**
   * @description Override generate to add evaluation after generation.
   * @category Action
   */
    async generate () {
        await this.start();
        if (!this.error()) {
            if (this.shouldEval()) {
                await this.asyncEvaluateImages();
            }
        }
        this.onPromptEnd();
    }


    evaluateActionInfo () {
        return {
            isVisible: true,
            isEnabled: this.allResultImages().length > 0
        };
    }

    /**
   * @description Evaluates the generated images using ImagesEvaluator.
   * @returns {Promise<void>}
   * @category Evaluation
   */
    async asyncEvaluateImages () {
        try {
            // Performance monitoring: Start evaluation timing
            performance.mark("evaluation-start");

            this.appendStatus("Preparing to evaluate images...");
            this.imageEvaluators().removeAllSubnodes();

            // setup image evaluators - pass imageNode directly, no SvImage intermediary
            for (const fileToDownload of this.allResultImages()) {
                await fileToDownload.asyncFetchIfNeeded();
                if (this.shouldRemoveBorders()) {
                    // Crop BEFORE scoring so the evaluator judges what players
                    // would see, and before the blob is stored/copied anywhere
                    // downstream (content-addressed hashes must be of the
                    // cropped bytes). A failed crop never blocks evaluation.
                    try {
                        const didCrop = await SvImageBorderRemover.clone().asyncCropImageNodeInPlace(fileToDownload.imageNode());
                        if (didCrop) {
                            this.appendStatus("Removed border from a generated image.");
                        }
                    } catch (error) {
                        console.warn(this.logPrefix(), "border removal failed (continuing with original image):", error.message);
                    }
                }
                const evaluator = this.imageEvaluators().add();
                evaluator.setSvImage(fileToDownload.imageNode());
                evaluator.setImageGenPrompt(this.prompt());
            }

            this.setStatus("Evaluating images...");
            await this.imageEvaluators().asyncEvaluate(); // evals in parallel
            const bestImageNode = this.imageEvaluators().bestSvImage();
            this.setResultImageNode(bestImageNode);
            this.setStatus("Selected best image!");

            // Performance monitoring: Complete evaluation timing
            performance.mark("evaluation-end");
            performance.measure("evaluation-duration", "evaluation-start", "evaluation-end");

        } catch (error) {
            // Performance monitoring: Mark end even on error
            performance.mark("evaluation-end");
            performance.measure("evaluation-duration", "evaluation-start", "evaluation-end");

            this.throwEvalError(error);
        }
    }

    /**
   * @description Processes the evaluation results from ImagesEvaluator.
   * The best image has already been selected by the evaluator's selectBestImage() method.
   * @category Evaluation
   */
    bestImage () {
        return this.imageEvaluators().bestSvImage();
    }

    /**
     * @description Backward-compatible async accessor for the best result image as a data URL.
     * @returns {Promise<string|null>} The data URL of the best result image, or null.
     * @category Results
     */
    async resultImageUrlData () {
        const node = this.resultImageNode();
        if (node && node.hasImage()) {
            return await node.asyncDataUrl();
        }
        return null;
    }

    onUpdateSlotStatus (oldValue, newValue) {
        this.shareProgress(newValue);
    }

    throwEvalError (error) {
        const normalizedError = Error.normalizeError(error);
        console.error(this.logPrefix(), "Image evaluation failed:", normalizedError);
        this.setError(normalizedError);
        this.setStatus("Error: " + normalizedError.message);
        throw normalizedError;
    }

}).initThisClass();
