/**
 * @module library.services.ImaginePro
 */

/**
 * @class ImageEvaluator
 * @extends SvSummaryNode
 * @classdesc Evaluates a single image using Gemini's vision model based on custom prompts.
 * This class provides image evaluation for a single image, useful for parallel evaluation
 * or when evaluating images individually.
 */
"use strict";

(class ImageEvaluator extends SvSummaryNode {

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {SvImage} svImage
     * @description The image to evaluate.
     * @category Data
     */
        {
            const slot = this.newSlot("svImage", null);
            slot.setFinalInitProto(SvImage);
            slot.setSlotType("SvImage");
            slot.setLabel("Image to Evaluate");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDescription("The image to evaluate");
            slot.setFieldInspectorClassName("SvImageWellField");
        }

        /**
     * @member {string} imageGenPrompt
     * @description The prompt that was used to generate the image.
     * @category Configuration
     */
        {
            const slot = this.newSlot("imageGenPrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Image Generation Prompt");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("The prompt that was used to generate the image");
        }

        /**
         * @member {EvalChecklistItems} checklist
         * @description Detailed checklist of prompt elements.
         * @category Results
         */
        {
            const slot = this.newSlot("checklist", null);
            slot.setFinalInitProto(EvalChecklistItems);
            slot.setLabel("Checklist");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(true);
            slot.setDescription("Checklist of prompt elements found in the image");
        }

        /**
     * @member {number} score
     * @description The evaluation score for the image.
     * @category Results
     */
        {
            const slot = this.newSlot("score", null);
            slot.setSlotType("Number");
            slot.setLabel("Score");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(true);
            slot.setDescription("Evaluation score (0.0-1.0)");
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key: value");
        }


        /**
     * @member {string} status
     * @description Current status of the evaluation.
     * @category Status
     */
        {
            const slot = this.newSlot("status", "");
            slot.setSlotType("String");
            slot.setLabel("Status");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDescription("Current evaluation status");
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key: value");
        }

        /**
     * @member {Error} error
     * @description Any error that occurred during evaluation.
     * @category Status
     */
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
            slot.setLabel("Error");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(true);
            slot.setDescription("Error from evaluation process");
            slot.setSummaryFormat("key: value");
        }

        /**
     * @member {SvXhrRequest} svXhrRequest
     * @description The XHR request used for evaluation.
     * @category Request
     */
        {
            const slot = this.newSlot("svXhrRequest", null);
            slot.setSlotType("SvXhrRequest");
            slot.setLabel("XHR Request");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(true);
            slot.setDescription("XHR request used for Gemini API call");
        }


        // Action to evaluate the image
    /*
    {
      const slot = this.newSlot("evaluateAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Evaluate Image");
      slot.setCanInspect(true);
     // slot.setIsAction(true);
    }
     */
    }

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setTitle("Image Evaluator");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeSubtitleIsChildrenSummary(true);
    }

    /**
   * @description Action to evaluate the image.
   * @returns {Promise<ImageEvaluator>} Returns this for chaining.
   * @category Actions
   */
    async evaluateAction () {
        await this.asyncEvaluate();
        return this;
    }

    issuesArray () {
        const issues = [];

        if (!this.svImage()) {
            issues.push("No image to evaluate");
        }

        /*
        if (this.svImage() && !this.svImage().hasPublicUrl()) {
            issues.push("Image needs a public URL for evaluation");
        }
        */

        if (!this.imageGenPrompt()) {
            issues.push("Image generation prompt is required");
        }

        return issues;
    }

    issuesMessage () {
        const issues = this.issuesArray();
        if (issues.length > 0) {
            return issues.join(", ");
        }
        return null;
    }

    assertReadyToEvaluate () {
        const issuesMsg = this.issuesMessage();
        if (issuesMsg) {
            throw new Error("Cannot evaluate: " + issuesMsg);
        }
    }

    clearEvaluationResults () {
        this.setStatus("");
        this.setError(null);
        this.setScore(null);
        //this.setReasoning("");
        this.checklist().removeAllSubnodes();
    }

    async asyncImageAsBase64 () {
        const dataUrl = this.svImage().dataURL();
        if (!dataUrl) {
            throw new Error("Image has no data URL");
        }
        // Extract base64 portion (after "data:image/jpeg;base64," or similar)
        const parts = dataUrl.split(',');
        if (parts.length < 2) {
            throw new Error("Invalid data URL format");
        }
        return parts[1];
    }


    onUpdateSlotStatus (oldValue, newValue) {
        this.shareProgress("image " + (this.subnodeIndex() + 1) + ": " + newValue);
    }

    /**
   * @description Main evaluation method.
   * @returns {Promise<ImageEvaluator>} Returns this for chaining.
   * @category Evaluation
   */
    async asyncEvaluate () {
        try {
            this.clearEvaluationResults();
            this.setStatus("Starting evaluation...");

            this.assertReadyToEvaluate();

            // Perform evaluation
            await this.asyncPerformEvaluation();

            this.setStatus("Evaluation complete");

        } catch (error) {
            console.error("Evaluation error:", error);
            this.setError(error);
            this.setStatus("Evaluation failed");
            throw error;
        }

        return this;
    }

    systemPrompt () {
        return `You are an expert image evaluator. You will evaluate a single image based on how accurately it matches the generation prompt.

    SCORING METHODOLOGY:
    1. First, create a checklist by parsing the generation prompt to identify:
       - Objects/subjects that should be present (e.g., "a cat", "mountains", "a sword")
       - Actions/poses described (e.g., "sitting", "flying", "wielding")
       - Attributes/descriptors (e.g., "red", "ancient", "glowing")
       - Settings/environments (e.g., "in a forest", "at sunset", "underwater")
       - Compositional elements (e.g., "in the foreground", "surrounded by", "facing left")
    
    2. Assign each checklist item a score (between 0.0 and 1.0) based on if it is present and correctly depicted.
        - A score of 0.0 is given if the item is not present.
        - A score between 0.0 and 1.0 is given if it is present but not correctly depicted.
        - A score of 1.0 is given if it is present and correctly depicted.
    
    IMPORTANT: Return ONLY a valid JSON array as your response. Do not include any markdown formatting, code fences, or explanatory text. Just the raw JSON array.

    Example format:
    [
        {
            "itemName": "glowing effect on sword",
            "score": 0.7,
            "reasoning": "The glowing effect on the sword is present but the color is incorrect."
        },
        {
            "itemName": "birds in background",
            "score": 0.0,
            "reasoning": "The birds are not present in the image."
        }
    ]`;
    }

    userPrompt () {
        const userPrompt = `Original Image Generation Prompt:
    "${this.imageGenPrompt()}"

    Please evaluate how well the image matches this prompt using the checklist methodology described in the system prompt.`;
        return userPrompt;
    }

    /**
     * @description Strips markdown code fences from text if present.
     * @param {string} text - Text that may contain markdown code fences
     * @returns {string} Text with code fences removed
     * @category Parsing
     */
    stripMarkdownCodeFences (text) {
        // Remove markdown code fences like ```json ... ``` or ``` ... ```
        const trimmed = text.trim();

        // Check for code fence at start
        const codeBlockRegex = /^```(?:json)?\s*\n([\s\S]*?)\n```$/;
        const match = trimmed.match(codeBlockRegex);

        if (match) {
            return match[1].trim();
        }

        return text;
    }

    async asyncComposeBodyJson () {
        const base64Data = await this.asyncImageAsBase64();
        console.log(this.logPrefix(), "Image converted to base64, size:", base64Data.length, "bytes");

        // Build the request body in standard message format
        // GeminiService will convert this to Gemini's native format
        const messages = [
            {
                role: "system",
                content: this.systemPrompt()
            },
            {
                role: "user",
                content: [
                    {
                        text: this.userPrompt()
                    },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Data
                        }
                    }
                ]
            }
        ];

        const bodyJson = {
            messages: messages,
            max_output_tokens: 8000
        };

        return bodyJson;
    }

    /**
   * @description Performs the actual evaluation with Gemini.
   * @returns {Promise<void>}
   * @category Evaluation
   */
    async asyncPerformEvaluation () {
        const bodyJson = await this.asyncComposeBodyJson();

        console.log(this.logPrefix(), "Request body size:", JSON.stringify(bodyJson).length, "bytes");

        // Use GeminiRequest for proper authentication, proxy handling, and error handling
        const request = GeminiRequest.clone();
        request.setChatModel(Services.shared().geminiService().defaultChatModel());
        request.setBodyJson(bodyJson);
        request.setIsStreaming(false); // We want the complete response, not streaming
        request.setTimeoutPeriodInMs(30 * 60 * 1000); // 30 minutes for vision API (can be slow)

        // Store reference to underlying XHR for debugging
        this.setSvXhrRequest(request.currentXhrRequest());

        console.log(this.logPrefix(), "Sending request to Gemini...");

        await request.asyncSendAndStreamResponse();

        if (request.error()) {
            throw new Error(`Gemini API error: ${request.error().message}`);
        }

        // Get the response text content from Gemini
        const responseText = request.fullContent();
        if (!responseText) {
            throw new Error("No response received from Gemini");
        }

        // Strip markdown code fences if present (Gemini often wraps JSON in ```json ... ```)
        const cleanedText = this.stripMarkdownCodeFences(responseText);

        // Parse the checklist JSON from the response text
        let checklistData;
        try {
            checklistData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Failed to parse checklist JSON:", cleanedText);
            console.error("Original response:", responseText);
            console.error("parseError:", parseError);
            throw new Error("Failed to parse evaluation results from Gemini - invalid JSON");
        }

        try {
            this.checklist().setJson(checklistData);
            this.processChecklist();
        } catch (parseError) {
            console.error("Failed to apply checklist data:", checklistData);
            console.error("parseError:", parseError);
            throw new Error("Failed to apply evaluation results");
        } finally {
            this.setSvXhrRequest(null);
        }
    }

    processChecklist () {
        const checklist = this.checklist();
        console.log(this.logPrefix(), "checklist:", JSON.stringify(checklist.asJson(), null, 2));

        this.setScore(Number(this.checklist().score()));

        //debugger;
        if (this.svImage()) {
            this.svImage().setTitle(this.score().toFixed(2));  // Show as 0.75, 0.92, etc.
        }
    }

    /**
   * @description Gets the subtitle for this evaluator.
   * @returns {string} The subtitle.
   * @category UI
   */
    subtitle () {
        if (this.error()) {
            return "Error: " + this.error().message;
        }

        if (this.status()) {
            return this.status();
        }

        if (this.score() !== null) {
            return `Score: ${this.score().toFixed(2)}`;
        }

        return "Ready to evaluate";
    }

    /**
   * @description Gets action info for the evaluate action.
   * @returns {Object} Action info.
   * @category Actions
   */
    evaluateActionInfo () {
        return {
            isEnabled: this.svImage() &&
                 this.imageGenPrompt(),
            isVisible: true,
            title: "Evaluate Image",
            subtitle: this.error() ? "Error: " + this.error().message : ""
        };
    }

}).initThisClass();
