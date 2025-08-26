/**
 * @module library.services.PiAPI.ImageEvalPrompts
 */

"use strict";

/**
 * @class PiApiImageEvalPrompt
 * @extends PiApiImagePrompt
 * @classdesc Extends PiApiImagePrompt to add automatic evaluation and selection of best image.
 * 
 * This class combines PiAPI's Midjourney generation (inherited from PiApiImagePrompt)
 * with OpenAI's evaluation capabilities to automatically select the best matching image.
 * 
 * How it works:
 * 1. Takes a content prompt (what to generate) and style prompt (artistic style)
 * 2. Combines them for the inherited Midjourney generation
 * 3. After generation completes, uses OpenAI's vision model to score each image
 * 4. Selects and stores the best matching image
 * 
 * Inherits all delegate messages from PiApiImagePrompt
 */

(class PiApiImageEvalPrompt extends PiApiImagePrompt {
    
    /**
     * @description Initializes the prototype slots for the PiApiImageEvalPrompt class.
     */
    initPrototypeSlots () {
        // Don't call super - the framework handles this automatically
        
        // The prompt slot exists from parent - just update its label
        {
            const slot = this.thisPrototype().slotNamed("prompt");
            if (slot) {
                slot.setLabel("Content Prompt");
            }
        }

        // Style prompt (artistic style)
        {
            const slot = this.newSlot("stylePrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Style Prompt");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }
        
        // Midjourney version
        {
            const slot = this.newSlot("midjourneyVersion", "7");
            slot.setSlotType("String");
            slot.setLabel("Midjourney Version");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setValidValues(["6", "7"]);
            slot.setAllowsNullValue(false);
            slot.setDescription("6: Use v6 (supports :: weights for precise control)\n7: Use v7 (latest model, natural language only)");
        }

        // Combined prompt (read-only, for display)
        {
            const slot = this.newSlot("combinedPrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Combined Prompt (sent to Midjourney)");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
        }

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
     * @description Builds the combined prompt for Midjourney from content and style.
     * @returns {string} The combined prompt.
     * @category Prompts
     */
    buildCombinedPrompt () {
        const content = this.prompt().trim();
        const style = this.stylePrompt().trim();
        
        if (!content) {
            return "";
        }
        
        const version = this.midjourneyVersion();
        const contentSentences = this.splitIntoSentences(content);
        const hasMultipleConcepts = contentSentences.length > 1 || style;
        
        let result;
        
        if (version === "7") {
            // v7: Use natural language, no weights
            if (style) {
                result = style + " " + content;
            } else {
                result = content;
            }
            
        } else {
            // v6: Use weighted syntax if multiple concepts
            if (hasMultipleConcepts) {
                const weightedContent = contentSentences
                    .map(sentence => sentence.trim())
                    .filter(sentence => sentence.length > 0)
                    .join("::1 ");
                
                if (style) {
                    const contentWeight = contentSentences.length;
                    const weightedStyle = style + "::" + contentWeight;
                    result = [weightedStyle, weightedContent].join(" ");
                } else {
                    result = weightedContent;
                }
            } else {
                // Single concept, but user selected v6
                result = content;
            }
        }
        
        // Always append version flag to be explicit
        return result + " --v " + version;
    }
    
    /**
     * @description Splits text into sentences.
     * @param {string} text - The text to split.
     * @returns {Array<string>} Array of sentences.
     * @category Prompts
     */
    splitIntoSentences (text) {
        // Split on sentence-ending punctuation followed by space or end of string
        // Keep the punctuation with the sentence
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
        
        // Clean up and filter out empty sentences
        return sentences
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }
    
    /**
     * @description Called when a slot is updated.
     * @param {Object} slot - The slot that was updated.
     * @param {*} oldValue - The old value.
     * @param {*} newValue - The new value.
     * @category Slot Updates
     */
    didUpdateSlot (slot, oldValue, newValue) {
        super.didUpdateSlot(slot, oldValue, newValue);
        
        // Update combined prompt when content or style changes
        if (slot.name() === "prompt" || slot.name() === "stylePrompt") {
            const combined = this.buildCombinedPrompt();
            this.setCombinedPrompt(combined);
        }
    }

    /**
     * @description Override generate to add evaluation after generation.
     * @category Action
     */
    async generate () {
        // Build the combined prompt (now includes --v 6 for compatibility)
        const combined = this.buildCombinedPrompt();
        
        if (!combined) {
            this.setError("Content prompt is required");
            return;
        }
        
        // Store the combined prompt for display
        this.setCombinedPrompt(combined);
        
        // Temporarily set the prompt to the combined version for generation
        const originalPrompt = this.prompt();
        this.setPrompt(combined);
        
        // Call parent generate method
        await super.generate();
        
        // Restore the original content prompt
        this.setPrompt(originalPrompt);
        
        // Don't proceed with evaluation if generation failed
        if (this.error()) {
            return;
        }
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
            console.error("Image evaluation failed:", error);
            this.setError("Evaluation failed: " + error.message);
        }
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
        
        const apiKey = this.openAiService().apiKeyOrUserAuthToken();
        const endpoint = 'https://api.openai.com/v1/chat/completions';
        
        // Use the content prompt (not the combined one) for evaluation
        const contentPrompt = this.prompt();
        
        // Build evaluation prompt
        const evaluationPrompt = `Evaluate how well each of these images matches this content prompt: "${contentPrompt}".

For each image, provide:
1. A score from 0 to 100 (where 100 is a perfect match)
2. A brief explanation of the score

Focus on how well the image captures the content described, not the artistic style.
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
            console.log(`Adding image ${index} to evaluation: ${imageNode.title()}`);
            if (imageUrl) {
                console.log(`  URL (first 100 chars): ${imageUrl.substring(0, 100)}...`);
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
        
        console.log("=== OpenAI Image Evaluation ===");
        console.log("Evaluating", imageNodes.length, "images");
        
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
            throw new Error(`OpenAI error: ${resultData.error?.message || response.statusText}`);
        }
        
        // Process the evaluation results
        if (resultData.choices && resultData.choices[0]) {
            const content = resultData.choices[0].message.content;
            console.log("Evaluation response:", content);
            
            // Try to parse JSON from the response
            try {
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    let scores = JSON.parse(jsonMatch[0]);
                    
                    // Check if OpenAI is using 1-based indices (all indices >= 1 and no index 0)
                    const hasIndexZero = scores.some(s => s.index === 0);
                    const minIndex = Math.min(...scores.map(s => s.index));
                    
                    if (!hasIndexZero && minIndex === 1) {
                        // Convert from 1-based to 0-based
                        console.log("Converting from 1-based to 0-based indices");
                        scores = scores.map(scoreObj => ({
                            ...scoreObj,
                            index: scoreObj.index - 1
                        }));
                    }
                    
                    // Remove any duplicate indices (keep the first occurrence)
                    const uniqueScores = [];
                    const seenIndices = new Set();
                    for (const score of scores) {
                        if (!seenIndices.has(score.index)) {
                            seenIndices.add(score.index);
                            uniqueScores.push(score);
                        } else {
                            console.warn(`Duplicate index ${score.index} found in evaluation scores, skipping`);
                        }
                    }
                    
                    this.setEvaluationScores(uniqueScores);
                    console.log("Evaluation scores (cleaned):", uniqueScores);
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
                console.error("Failed to parse evaluation scores:", parseError);
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
            console.warn("No scores or images to select from");
            return;
        }
        
        // Find the highest scoring image
        let bestScore = -1;
        let bestIndex = 0;
        
        console.log("Evaluating scores to find best image:");
        scores.forEach(scoreObj => {
            console.log(`  Image ${scoreObj.index}: score ${scoreObj.score}`);
            if (scoreObj.score > bestScore) {
                bestScore = scoreObj.score;
                bestIndex = scoreObj.index;
            }
        });
        
        console.log(`Best image is index ${bestIndex} with score ${bestScore}`);
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
            console.log(`Accessing imageNodes[${bestIndex}] from ${imageNodes.length} total images`);
            const bestImageNode = imageNodes[bestIndex];
            console.log(`Best image node title: ${bestImageNode.title()}`);
            
            // Try to get the same URL format we sent to OpenAI
            //const bestImageUrl = bestImageNode.imageUrl() || bestImageNode.url();
            const displayUrl = bestImageNode.imageUrl() || bestImageNode.dataUrl();
            
            console.log(`Best image URLs:`);
            console.log(`  imageUrl(): ${bestImageNode.imageUrl() ? 'exists' : 'null'}`);
            console.log(`  dataUrl(): ${bestImageNode.dataUrl() ? 'exists' : 'null'}`);
            console.log(`  url(): ${bestImageNode.url() ? 'exists' : 'null'}`);
            
            if (displayUrl) {
                // Log first 100 chars of the URL to verify it's the right image
                console.log(`Setting result image URL (first 100 chars): ${displayUrl.substring(0, 100)}...`);
                this.setResultImageUrlData(displayUrl);
                console.log(`Selected best image: index ${bestIndex} with score ${bestScore}`);
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
     * @returns {boolean} True if generation can be performed, false otherwise.
     * @category Validation
     */
    canGenerate () {
        const hasContent = super.canGenerate();
        const hasOpenAiKey = !this.autoEvaluate() || this.openAiService().hasApiKey();
        return hasContent && hasOpenAiKey;
    }

    /**
     * @description Gets information about the generate action.
     * @returns {Object} The action information.
     * @category Action
     */
    generateActionInfo () {
        const baseInfo = super.generateActionInfo();
        
        if (this.autoEvaluate() && !this.openAiService().hasApiKey()) {
            return {
                isEnabled: false,
                isVisible: true,
                title: "OpenAI API key required for evaluation"
            };
        }
        
        return baseInfo;
    }

}.initThisClass());