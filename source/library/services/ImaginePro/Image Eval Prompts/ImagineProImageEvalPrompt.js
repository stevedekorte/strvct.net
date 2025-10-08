/**
 * @module library.services.ImaginePro.Image_Eval_Prompts
 */

/**
 * @class ImagineProImageEvalPrompt
 * @extends ImagineProImagePrompt
 * @classdesc An ImaginePro image eval prompt that generates images and evaluates them with OpenAI.
 *
 * How it works:
 * 1. Generates images using the parent ImagineProImagePrompt parent class
 * 2. Uses ImageEvaluators to evaluate how well each image matches the prompt
 * 3. Selects and stores the best matching image in resultImageUrlData slot
 */
"use strict";

(class ImagineProImageEvalPrompt extends ImagineProImagePrompt {

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("imageEvaluators", null);
            slot.setFinalInitProto(ImageEvaluators);
            slot.setLabel("Images Evaluations");
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        // Result image URL data (the best matching image) - kept for compatibility
        {
            const slot = this.newSlot("resultImageUrlData", null);
            slot.setSlotType("String");
            slot.setLabel("Best Result Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setFieldInspectorViewClassName("SvImageWellField");
            slot.setCanEditInspection(false);
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
        await super.generate();
        await this.asyncEvaluateImages();
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
            this.setStatus("preparing evaluation...");
            this.imageEvaluators().removeAllSubnodes();

            // setup image evaluators
            this.allResultImages().forEach(fileToDownload => {
                const svImage = SvImage.clone();
                svImage.setDataURL(fileToDownload.dataUrl());
                const evaluator = this.imageEvaluators().add();
                //debugger;
                evaluator.setSvImage(svImage);
                evaluator.setImageGenPrompt(this.prompt());
            });

            this.setStatus("evaluating images...");
            await this.imageEvaluators().asyncEvaluate(); // evals in parallel
            const bestImage = this.imageEvaluators().bestSvImage();
            this.setResultImageUrlData(bestImage.dataURL());
            this.setStatus("evaluation complete");

        } catch (error) {
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


    throwEvalError (error) {
        const normalizedError = Error.normalizeError(error);
        console.error(this.logPrefix(), "Image evaluation failed:", normalizedError);
        this.setError(normalizedError);
        this.setStatus("Error: " + normalizedError.message);
        throw normalizedError;
    }

}).initThisClass();
