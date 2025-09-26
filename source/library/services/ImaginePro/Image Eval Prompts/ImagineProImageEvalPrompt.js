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
      const slot = this.newSlot("evalCompletionPromise", null);
      slot.setSlotType("Promise");
    }

    // Update generate action label
    {
        const slot = this.thisPrototype().slotNamed("generateAction");
        slot.setLabel("Generate & Evaluate");
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
    this.setEvalCompletionPromise(Promise.clone());
    
    await super.generate();
    
    // Don't proceed with evaluation if generation failed
    if (this.error()) {
      this.onEvalError(this.error());
    }
    return this.evalCompletionPromise();
  }

  /**
   * @description Override to add evaluation after successful generation.
   * @param {Object} generation - The generation object.
   * @category Delegation
   */
  onImageGenerationEnd (generation) {
    // Let parent handle the basic completion
    super.onImageGenerationEnd(generation);
    
    // If generation was successful, evaluate
    if (generation.status() === "completed") {
      this.evaluateImages();
    } 
  }

  /**
   * @description Evaluates the generated images using ImagesEvaluator.
   * @returns {Promise<void>}
   * @category Evaluation
   */
  async evaluateImages () {
    try {
      this.setStatus("preparing evaluation...");
      
      this.images().subnodes().forEach(node => {
        const svImage = node.asSvImage();
        const evaluator = this.imageEvaluators().add();
        evaluator.setSvImage(svImage);
        evaluator.setImageGenPrompt(this.prompt());
        evaluator.evaluate();
      });

      this.setStatus("evaluating images...");      
      await this.imageEvaluators().asyncEvaluate();
      this.processEvaluationResults();
    
      this.setStatus("evaluation complete");
      
    } catch (error) {
      console.error(this.logPrefix(), "Image evaluation failed:", error);
      this.setError(new Error("Evaluation failed: " + error.message));
      return this.onEvalError(error);
    }
    return this.onEvalCompletion();
  }

  /**
   * @description Processes the evaluation results from ImagesEvaluator.
   * The best image has already been selected by the evaluator's selectBestImage() method.
   * @category Evaluation
   */
  processEvaluationResults () {
    //const bestSvImage = this.imageEvaluators().bestSvImage();
    const bestIndex = this.imageEvaluators().bestImageIndex();

    // Send delegate notification if we have a corresponding image node
    const imageNodes = this.images().subnodes();
    if (bestIndex < imageNodes.length) {
        this.sendDelegateMessage("onImagePromptImageLoaded", [this, imageNodes[bestIndex]]);
    }
  }

  onEvalCompletion () {
    this.evalCompletionPromise().callResolveFunc(this);
  }

  onEvalError (error) {
    const normalizedError = Error_ideal.normalizeError(error);
    this.setError(normalizedError);
    this.setStatus("Error: " + normalizedError.message);
    this.evalCompletionPromise().callRejectFunc(normalizedError);
  }

}).initThisClass();