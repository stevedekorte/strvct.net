/**
 * @module library.services.ImaginePro.Image_Eval_Prompts
 */

/**
 * @class ImagineProImageEvalPrompt
 * @extends ImagineProImagePrompt
 * @classdesc An ImaginePro image eval prompt that generates images and evaluates them with OpenAI.
 * 
 * How it works:
 * 1. Generates images using the parent ImagineProImagePrompt class
 * 2. Uses ImagesEvaluator to evaluate how well each image matches the prompt
 * 3. Selects and stores the best matching image in resultImageUrlData slot
 * 4. Provides evaluation scores for all generated images
 */
"use strict";

(class ImagineProImageEvalPrompt extends ImagineProImagePrompt {

  /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
  initPrototypeSlots () {
    
    // ImagesEvaluator instance for handling evaluation
    {
      const slot = this.newSlot("imagesEvaluator", null);
      slot.setFinalInitProto(ImagesEvaluator);
      slot.setSlotType("ImagesEvaluator");
      slot.setLabel("Images Evaluator");
      slot.setIsSubnode(true);
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDescription("Evaluator for generated images");
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

    // Auto-evaluate flag
    {
      const slot = this.newSlot("autoEvaluate", true);
      slot.setSlotType("Boolean");
      slot.setLabel("Auto Evaluate");
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
    }

    {
      const slot = this.newSlot("evalCompletionPromise", null);
      slot.setSlotType("Promise");
    }

    // Update generate action label
    {
      const slot = this.thisPrototype().slotNamed("generateAction");
      if (slot) {
        slot.setLabel("Generate & Evaluate");
      }
    }
  }

  /**
   * @description Gets the OpenAI service for evaluation.
   * @returns {Object} The OpenAI service.
   * @category Service
   */
  openAiService () {
    return OpenAiService.shared();
  }

  /**
   * @description Override title to show it's an eval prompt.
   * @returns {string} The title.
   * @category Metadata
   */
  title () {
    const p = this.prompt().clipWithEllipsis(15);
    return p ? `Eval: ${p}` : "Eval Prompt";
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
    
    // If auto-evaluate is enabled and generation was successful, evaluate
    if (generation.status() === "completed") {
      this.evaluateImages();
    } 
  }

  copyOfImageNodes () {
    const imageNodes = this.images().subnodes();
    return imageNodes.map(node => node.copy());
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
        node.setSubtitle(node.imageGenPrompt());
      });
      // Prepare the evaluator
      const evaluator = this.imagesEvaluator();      
      evaluator.setSvImageNodes(this.copyOfImageNodes());
      evaluator.setImageGenPrompt(this.prompt());
      this.setStatus("evaluating images with OpenAI...");      
      await evaluator.evaluate();
      
      this.processEvaluationResults();
    
      this.setStatus("evaluation complete");
      
    } catch (error) {
      this.logError("Image evaluation failed:", error);
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
    const evaluator = this.imagesEvaluator();
    
    // Get the best image that was already selected by evaluator.selectBestImage()
    const bestImage = evaluator.bestImage();
    const bestIndex = evaluator.bestImageIndex();
    
    if (bestImage && bestImage.imageUrl()) {
      // Set the result image URL for compatibility
      this.setResultImageUrlData(bestImage.imageUrl());
      
      // Log the selection
      const results = evaluator.evaluationResults();
      if (results && results[bestIndex]) {
        const bestScore = results[bestIndex].score;
        this.log(`Selected best image: index ${bestIndex} with score ${bestScore}`);
      }
      
      // Send delegate notification if we have a corresponding image node
      const imageNodes = this.images().subnodes();
      if (bestIndex < imageNodes.length) {
        this.sendDelegate("onImagePromptImageLoaded", [this, imageNodes[bestIndex]]);
      }
    }
  }

  onEvalCompletion () {
    this.evalCompletionPromise().callResolveFunc(this);
  }

  onEvalError (error) {
    // Handle different error types
    let errorMessage;
    let errorObj;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorObj = error;
    } else if (typeof error === 'string') {
      errorMessage = error;
      errorObj = new Error(errorMessage);
    } else {
      errorMessage = String(error);
      errorObj = new Error(errorMessage);
    }
    
    this.setError(errorObj);
    this.setStatus("Error: " + errorMessage);
    this.evalCompletionPromise().callRejectFunc(errorObj);
  }

  /**
   * @description Gets a descriptive subtitle based on current state.
   * @returns {string} The subtitle.
   * @category UI
   */
  subtitle () {
    if (this.resultImageUrlData()) {
      const evaluator = this.imagesEvaluator();
      const results = evaluator ? evaluator.evaluationResults() : null;
      const bestIndex = evaluator ? evaluator.bestImageIndex() : null;
      
      if (results && bestIndex !== null && results[bestIndex]) {
        const bestScore = results[bestIndex].score || 0;
        return `Complete - Best score: ${bestScore}`;
      }
    }
    
    return super.subtitle();
  }

  /**
   * @description Override to check both services.
   * @returns {Promise<boolean>} True if generation can be performed, false otherwise.
   * @category Validation
   */
  async canGenerate () {
    const hasContent = await super.canGenerate();
    const hasOpenAiKey = !this.autoEvaluate() || await this.openAiService().hasApiKey();
    return hasContent && hasOpenAiKey;
  }

  /**
   * @description Override to check OpenAI service for evaluation.
   * @returns {Object} Action info.
   * @category Actions
   */
  generateActionInfo () {
    const parentInfo = super.generateActionInfo();
    if (!this.autoEvaluate()) {
      return parentInfo;
    }
    
    // Check if OpenAI is configured for evaluation
    const hasOpenAiKey = this.openAiService().hasApiKey();
    if (!hasOpenAiKey) {
      return {
        ...parentInfo,
        isEnabled: false,
        title: parentInfo.title,
        subtitle: "OpenAI API key required for evaluation"
      };
    }
    
    return parentInfo;
  }

  /**
   * @description Helper method to get evaluation scores for compatibility.
   * @returns {Array} The evaluation scores from the evaluator.
   * @category Compatibility
   */
  evaluationScores () {
    const evaluator = this.imagesEvaluator();
    return evaluator ? evaluator.evaluationResults() : [];
  }

  /**
   * @description Helper method to get best image index for compatibility.
   * @returns {number|null} The best image index from the evaluator.
   * @category Compatibility
   */
  bestImageIndex () {
    const evaluator = this.imagesEvaluator();
    return evaluator ? evaluator.bestImageIndex() : null;
  }

}).initThisClass();