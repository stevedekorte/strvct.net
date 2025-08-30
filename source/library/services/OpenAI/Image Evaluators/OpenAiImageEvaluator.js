"use strict";

/**
 * @module library.services.OpenAI.ImageEvaluators
 */

/**
 * @class OpenAiImageEvaluator
 * @extends SvSummaryNode
 * @classdesc Evaluates images against a content prompt using OpenAI's vision capabilities.
 * 
 * This class takes a list of images and a content prompt, then uses OpenAI's
 * vision model to score each image based on how well it matches the prompt.
 * 
 * How it works:
 * - Takes a content prompt describing what the images should contain
 * - Accepts multiple images (via URLs or data URLs)
 * - Uses OpenAI's vision model to analyze and score each image
 * - Returns scores (0-100) for each image indicating match quality
 */

(class OpenAiImageEvaluator extends SvSummaryNode {
    
    /**
     * @description Initializes the prototype slots for the OpenAiImageEvaluator class.
     */
    initPrototypeSlots () {

        // Content prompt to evaluate against
        {
            const slot = this.newSlot("contentPrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Content Prompt");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }

        // Array of image URLs to evaluate
        {
            const slot = this.newSlot("imageUrls", null);
            slot.setSlotType("Array");
            slot.setLabel("Image URLs");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setInitValue([]);
        }

        // Array of image data URLs (for drag/drop)
        {
            const slot = this.newSlot("imageDataUrls", null);
            slot.setSlotType("Array");
            slot.setLabel("Image Data URLs");
            slot.setIsSubnodeField(false);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setInitValue([]);
        }

        // Evaluation criteria (optional additional guidance)
        {
            const slot = this.newSlot("evaluationCriteria", "");
            slot.setSlotType("String");
            slot.setLabel("Evaluation Criteria (Optional)");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }

        // Result scores (array of objects with image index and score)
        {
            const slot = this.newSlot("scores", null);
            slot.setSlotType("Array");
            slot.setLabel("Scores");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
            slot.setInitValue([]);
        }

        // Detailed evaluation results
        {
            const slot = this.newSlot("evaluationResults", null);
            slot.setSlotType("String");
            slot.setLabel("Evaluation Results");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
        }

        // Error message
        {
            const slot = this.newSlot("error", "");
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Status message
        {
            const slot = this.newSlot("status", "");
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // Evaluate action
        {
            const slot = this.newSlot("evaluateAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Evaluate Images");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("evaluate");
        }

        // Add image action
        {
            const slot = this.newSlot("addImageAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Add Image");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("addImage");
        }

        // Clear images action
        {
            const slot = this.newSlot("clearImagesAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Clear Images");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("clearImages");
        }
    }

    initPrototype () {
        this.setTitle("Image Evaluator");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([]);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(true);
        this.setNodeFillsRemainingWidth(false);
    }

    /**
     * @description Gets the OpenAI service.
     * @returns {Object} The service.
     * @category Service
     */
    service () {
        return OpenAiService.shared();
    }

    /**
     * @description Adds an image for evaluation
     * @returns {Promise<void>}
     * @category Actions
     */
    async addImage () {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            
            const filesSelected = new Promise((resolve, reject) => {
                input.onchange = (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                        resolve(files);
                    } else {
                        reject(new Error('No files selected'));
                    }
                };
            });
            
            input.click();
            const files = await filesSelected;
            
            // Convert files to data URLs
            const dataUrls = await Promise.all(files.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }));
            
            // Add to existing data URLs
            const currentDataUrls = this.imageDataUrls() || [];
            this.setImageDataUrls([...currentDataUrls, ...dataUrls]);
            
            this.setStatus(`Added ${files.length} image(s) for evaluation`);
            
        } catch (error) {
            console.error("Failed to add images:", error);
            this.setError("Failed to add images: " + error.message);
        }
    }

    /**
     * @description Clears all images
     * @category Actions
     */
    clearImages () {
        this.setImageUrls([]);
        this.setImageDataUrls([]);
        this.setScores([]);
        this.setEvaluationResults(null);
        this.setStatus("Images cleared");
    }

    /**
     * @description Evaluates the images against the content prompt
     * @returns {Promise<void>}
     * @category Actions
     */
    async evaluate () {
        try {
            this.setError("");
            this.setStatus("starting evaluation...");
            
            // Check if OpenAI service has API key
            if (!this.service().hasApiKey()) {
                throw new Error("OpenAI API key is not configured. Please set your API key in OpenAI Service settings.");
            }
            
            // Validate inputs
            if (!this.contentPrompt() || this.contentPrompt().trim() === "") {
                throw new Error("Content prompt is required");
            }
            
            // Collect all images (URLs and data URLs)
            const allImages = [];
            
            if (this.imageUrls() && this.imageUrls().length > 0) {
                this.imageUrls().forEach((url, index) => {
                    allImages.push({ type: 'url', value: url, index: index });
                });
            }
            
            if (this.imageDataUrls() && this.imageDataUrls().length > 0) {
                this.imageDataUrls().forEach((dataUrl, index) => {
                    allImages.push({ type: 'dataUrl', value: dataUrl, index: index + (this.imageUrls()?.length || 0) });
                });
            }
            
            if (allImages.length === 0) {
                throw new Error("No images to evaluate. Please add images first.");
            }
            
            this.setStatus(`evaluating ${allImages.length} image(s)...`);
            
            // Use OpenAI's vision model to evaluate each image
            const apiKey = await this.service().apiKeyOrUserAuthToken();
            const endpoint = 'https://api.openai.com/v1/chat/completions';
            
            // Build the evaluation prompt
            let evaluationPrompt = `Evaluate how well each of the following images matches this content prompt: "${this.contentPrompt()}".\n\n`;
            
            if (this.evaluationCriteria()) {
                evaluationPrompt += `Additional evaluation criteria: ${this.evaluationCriteria()}\n\n`;
            }
            
            evaluationPrompt += `For each image, provide:
1. A score from 0 to 100 (where 100 is a perfect match)
2. A brief explanation of the score

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
            allImages.forEach((img, idx) => {
                if (img.type === 'url') {
                    messages[0].content.push({
                        type: "image_url",
                        image_url: {
                            url: img.value
                        }
                    });
                } else if (img.type === 'dataUrl') {
                    messages[0].content.push({
                        type: "image_url",
                        image_url: {
                            url: img.value
                        }
                    });
                }
            });
            
            const bodyJson = {
                model: "gpt-4o", // Vision model
                messages: messages,
                max_tokens: 1000
            };
            
            console.log("=== OpenAI Image Evaluation API Call ===");
            console.log("Evaluation prompt:", evaluationPrompt);
            console.log("Number of images:", allImages.length);
            
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
                throw new Error(`API error: ${resultData.error?.message || response.statusText}`);
            }
            
            // Process the results
            if (resultData.choices && resultData.choices[0]) {
                const content = resultData.choices[0].message.content;
                console.log("Evaluation response:", content);
                
                // Try to parse JSON from the response
                try {
                    const jsonMatch = content.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        const scores = JSON.parse(jsonMatch[0]);
                        this.setScores(scores);
                        this.setEvaluationResults(content);
                        
                        // Find best and worst scores
                        const bestScore = Math.max(...scores.map(s => s.score));
                        const worstScore = Math.min(...scores.map(s => s.score));
                        
                        this.setStatus(`Evaluation complete. Best score: ${bestScore}, Worst score: ${worstScore}`);
                    } else {
                        // Fallback: store the raw response
                        this.setEvaluationResults(content);
                        this.setStatus("Evaluation complete (see results for details)");
                    }
                } catch (parseError) {
                    console.error("Failed to parse scores:", parseError);
                    this.setEvaluationResults(content);
                    this.setStatus("Evaluation complete (see results for details)");
                }
            } else {
                throw new Error("No response from evaluation");
            }
            
        } catch (error) {
            console.error("Image evaluation failed:", error);
            this.setError(error.message);
            this.setStatus("evaluation failed");
        }
    }

    /**
     * @description Gets action info for the evaluate action.
     * @returns {Object} Action info.
     * @category Actions
     */
    evaluateActionInfo () {
        const hasContent = !!(this.contentPrompt() && this.contentPrompt().trim() !== "");
        const hasImages = !!((this.imageUrls() && this.imageUrls().length > 0) ||
                           (this.imageDataUrls() && this.imageDataUrls().length > 0));
        
        return {
            isEnabled: hasContent && hasImages,
            isVisible: true
        };
    }

    /**
     * @description Gets action info for the add image action.
     * @returns {Object} Action info.
     * @category Actions
     */
    addImageActionInfo () {
        return {
            isEnabled: true,
            isVisible: true
        };
    }

    /**
     * @description Gets action info for the clear images action.
     * @returns {Object} Action info.
     * @category Actions
     */
    clearImagesActionInfo () {
        const hasImages = !!((this.imageUrls() && this.imageUrls().length > 0) ||
                           (this.imageDataUrls() && this.imageDataUrls().length > 0));
        
        return {
            isEnabled: hasImages,
            isVisible: true
        };
    }

    /**
     * @description Gets a descriptive subtitle based on current state.
     * @returns {string} The subtitle.
     * @category UI
     */
    subtitle () {
        if (this.error()) {
            return "Error: " + this.error();
        }
        
        if (this.scores() && this.scores().length > 0) {
            const avgScore = this.scores().reduce((sum, s) => sum + s.score, 0) / this.scores().length;
            return `Evaluated: Avg score ${avgScore.toFixed(1)}`;
        }
        
        if (this.status()) {
            return this.status();
        }
        
        const imageCount = (this.imageUrls()?.length || 0) + (this.imageDataUrls()?.length || 0);
        if (imageCount > 0) {
            return `${imageCount} image(s) ready`;
        }
        
        return "Ready";
    }

}.initThisClass());