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
 * 2. Uses OpenAI's vision model to evaluate how well each image matches the prompt
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
    
    // Evaluation scores from OpenAI (array of objects)
    {
      const slot = this.newSlot("evaluationScores", null);
      slot.setSlotType("Array");
      slot.setLabel("Evaluation Scores");
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setInitValue([]);
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("evaluationScoresString", "");
      slot.setSlotType("String");
      slot.setLabel("Evaluation Scores String");
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setInitValue("");
      slot.setCanEditInspection(false);
    }

    // Best image index (0-3)
    {
      const slot = this.newSlot("bestImageIndex", null);
      slot.setSlotType("Number");
      slot.setLabel("Best Image Index");
      slot.setIsSubnodeField(true);
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setCanEditInspection(false);
    }

    // Result image URL data (the best matching image)
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
    
    // Call parent generate
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
    if (this.autoEvaluate() && 
        generation.status() === "completed" && 
        this.images().subnodes().length > 0) {
        
      // Start evaluation process
      this.evaluateImages();
    } else if (!this.autoEvaluate()) {
      // If not evaluating, complete immediately
      this.onEvalCompletion();
    }
  }

  /**
   * @description Evaluates the generated images.
   * @returns {Promise<void>}
   * @category Evaluation
   */
  async evaluateImages () {
    try {
      this.setStatus("evaluating images with OpenAI...");
      
      // Check if OpenAI service has API key
      if (!this.openAiService().hasApiKey()) {
        this.setError("OpenAI API key not configured for evaluation");
        return;
      }
      
      // Evaluate with OpenAI
      await this.evaluateWithOpenAI();
      
      // Select best image
      await this.selectBestImage();
      
      this.setStatus("evaluation complete");
      
    } catch (error) {
      this.logError("Image evaluation failed:", error);
      this.setError("Evaluation failed: " + error.message);
      return this.onEvalError(error);
    }
    return this.onEvalCompletion();
  }

  onEvalCompletion () {
    this.evalCompletionPromise().callResolveFunc(this);
  }

  onEvalError (error) {
    this.setError(error);
    this.setStatus("Error: " + error.message);
    this.evalCompletionPromise().callRejectFunc(error);
  }

  /**
   * @description Evaluates generated images with OpenAI.
   * @returns {Promise<void>}
   * @category Evaluation
   */
  async evaluateWithOpenAI () {
    const imageNodes = this.images().subnodes();
    if (!imageNodes || imageNodes.length === 0) {
      throw new Error("No images to evaluate");
    }
    
    const apiKey = await this.openAiService().apiKeyOrUserAuthToken();
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    
    // Use the prompt for evaluation
    const contentPrompt = this.prompt();
    
    // Build evaluation prompt
    const evaluationPrompt = `Evaluate how well each of these images matches this prompt: "${contentPrompt}".

For each image, provide:
1. A score from 0 to 100 (where 100 is a perfect match)
2. A brief explanation of the score

Focus on how well the image captures the content described.
Reduce the score heavily if the image has a border of any kind (e.g. white, painting frame, etc.)

IMPORTANT: Use 0-based indexing for the images (first image is index 0, second is index 1, etc.).

Return the results as a JSON array with objects containing: {"index": <number>, "score": <number>, "explanation": "<string>"}`;
    
    // Format the request with all images
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: evaluationPrompt
          }
        ]
      }
    ];
    
    // Add all images to the message
    imageNodes.forEach((imageNode, index) => {
      const imageUrl = imageNode.imageUrl() || imageNode.url();
      this.log(`Adding image ${index} to evaluation: ${imageNode.title()}`);
      if (imageUrl) {
        this.log(`  URL (first 100 chars): ${imageUrl.substring(0, 100)}...`);
        messages[0].content.push({
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        });
      }
    });
    
    const bodyJson = {
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1000
    };
    
    this.log("=== OpenAI Image Evaluation ===");
    this.log("Evaluating", imageNodes.length, "images");
    
    const proxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(endpoint);
    
    const response = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyJson)
    });
    
    const resultData = await response.json();
    
    if (!response.ok) {
      const error = new Error(`OpenAI error: ${resultData.error?.message || response.statusText}`);
      this.onEvalError(error);
      return;
    }
    
    // Process the evaluation results
    if (resultData.choices && resultData.choices[0]) {
      const content = resultData.choices[0].message.content;
      this.log("Evaluation response:", content);
      
      // Try to parse JSON from the response
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          let scores = JSON.parse(jsonMatch[0]);
          
          // Check if OpenAI is using 1-based indices
          const hasIndexZero = scores.some(s => s.index === 0);
          const minIndex = Math.min(...scores.map(s => s.index));
          
          if (!hasIndexZero && minIndex === 1) {
            // Convert from 1-based to 0-based
            this.log("Converting from 1-based to 0-based indices");
            scores = scores.map(scoreObj => ({
              ...scoreObj,
              index: scoreObj.index - 1
            }));
          }
          
          // Remove any duplicate indices
          const uniqueScores = [];
          const seenIndices = new Set();
          for (const score of scores) {
            if (!seenIndices.has(score.index)) {
              seenIndices.add(score.index);
              uniqueScores.push(score);
            } else {
              this.logWarn(`Duplicate index ${score.index} found in evaluation scores, skipping`);
            }
          }
          
          this.setEvaluationScores(uniqueScores);
          this.log("Evaluation scores (cleaned):", uniqueScores);
        } else {
          // Fallback: give all images equal scores
          const defaultScores = imageNodes.map((node, idx) => ({
            index: idx,
            score: 50,
            explanation: "Could not parse evaluation"
          }));
          this.setEvaluationScores(defaultScores);
        }
      } catch (parseError) {
        this.logError("Failed to parse evaluation scores:", parseError);
        // Fallback scores
        const defaultScores = imageNodes.map((node, idx) => ({
          index: idx,
          score: 50,
          explanation: "Evaluation parsing failed"
        }));
        this.setEvaluationScores(defaultScores);
      }
    }
  }

  /**
   * @description Selects the best image based on evaluation scores.
   * @category Evaluation
   */
  async selectBestImage () {
    const scores = this.evaluationScores();
    this.setEvaluationScoresString(JSON.stringify(scores, null, 2));
    const imageNodes = this.images().subnodes();
    
    if (!scores || scores.length === 0 || !imageNodes || imageNodes.length === 0) {
      this.logWarn("No scores or images to select from");
      return;
    }
    
    // Find the highest scoring image
    let bestScore = -1;
    let bestIndex = 0;
    
    this.log("Evaluating scores to find best image:");
    scores.forEach(scoreObj => {
      this.log(`  Image ${scoreObj.index}: score ${scoreObj.score}`);
      if (scoreObj.score > bestScore) {
        bestScore = scoreObj.score;
        bestIndex = scoreObj.index;
      }
    });
    
    this.log(`Best image is index ${bestIndex} with score ${bestScore}`);
    this.setBestImageIndex(bestIndex);
    
    // Update image titles with scores
    scores.forEach((scoreObj) => {
      const idx = scoreObj.index;
      if (imageNodes[idx]) {
        const isBest = idx === bestIndex;
        const title = isBest ? 
          `Image ${idx + 1} ⭐ (Score: ${scoreObj.score})` :
          `Image ${idx + 1} (Score: ${scoreObj.score})`;
        imageNodes[idx].setTitle(title);
      }
    });
    
    // Set the best image as result
    if (bestIndex >= 0 && bestIndex < imageNodes.length) {
      this.log(`Accessing imageNodes[${bestIndex}] from ${imageNodes.length} total images`);
      const bestImageNode = imageNodes[bestIndex];
      this.log(`Best image node title: ${bestImageNode.title()}`);
      
      // Get the display URL for the best image
      const displayUrl = bestImageNode.imageUrl() || bestImageNode.dataUrl();
      
      this.log(`Best image URLs:`);
      this.log(`  imageUrl(): ${bestImageNode.imageUrl() ? 'exists' : 'null'}`);
      this.log(`  dataUrl(): ${bestImageNode.dataUrl() ? 'exists' : 'null'}`);
      this.log(`  url(): ${bestImageNode.url() ? 'exists' : 'null'}`);
      
      if (displayUrl) {
        this.setResultImageUrlData(displayUrl);
        this.log(`Selected best image: index ${bestIndex} with score ${bestScore}`);
        this.sendDelegate("onImagePromptImageLoaded", [this, bestImageNode]);
      }
    }
  }

  /**
   * @description Gets a descriptive subtitle based on current state.
   * @returns {string} The subtitle.
   * @category UI
   */
  subtitle () {
    if (this.resultImageUrlData()) {
      const scores = this.evaluationScores();
      if (scores && this.bestImageIndex() !== null) {
        const bestScore = scores[this.bestImageIndex()]?.score || 0;
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
   * @description Gets information about the generate action.
   * @returns {Promise<Object>} The action information.
   * @category Action
   */
  async generateActionInfo () {
    const baseInfo = await super.generateActionInfo();
    
    if (this.autoEvaluate() && !(await this.openAiService().hasApiKey())) {
      return {
        isEnabled: false,
        isVisible: true,
        title: "OpenAI API key required for evaluation"
      };
    }
    
    return baseInfo;
  }

}.initThisClass());