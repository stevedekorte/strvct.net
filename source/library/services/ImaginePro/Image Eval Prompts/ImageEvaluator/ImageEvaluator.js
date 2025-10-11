/**
 * @module library.services.ImaginePro
 */

/**
 * @class ImageEvaluator
 * @extends SvSummaryNode
 * @classdesc Evaluates a single image using OpenAI's vision model based on custom prompts.
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
            slot.setLabel("Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDescription("The image to evaluate");
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
     * @member {string} evaluationModel
     * @description The OpenAI model to use for evaluation.
     * @category Configuration
     */
        {
            const slot = this.newSlot("evaluationModel", "gpt-5");
            slot.setSlotType("String");
            slot.setLabel("Evaluation Model");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidValues(["gpt-4o-mini", "gpt-4o", "gpt-5-nano", "gpt-5-mini", "gpt-5"]);
            slot.setDescription("OpenAI model for image evaluation (gpt-4o-mini most economical, gpt-5 most capable)");
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
        }

        /**
     * @member {Object} checklist
     * @description Detailed checklist of prompt elements.
     * @category Results
     */
        {
            const slot = this.newSlot("checklist", null);
            slot.setSlotType("Array");
            slot.setLabel("Checklist");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(true);
            slot.setDescription("Checklist of prompt elements found in the image");
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
            slot.setDescription("XHR request used for OpenAI API call");
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
        this.setChecklist(null);
    }

    async asyncPublicUrlForImage () {
        const imageObject = await this.svImage().asImageObject().promiseLoaded();
        const imageArrayBuffer = await imageObject.asyncAsArrayBuffer();
        const publicUrl = await SvApp.shared().asyncPublicUrlForArrayBuffer(imageArrayBuffer);
        return publicUrl;
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

            this.setStatus("Evaluating image with OpenAI...");

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
    
    Return your evaluation checklist and scores as a JSON object. Here's an example:
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

    async asyncComposeBodyJson () {
        const publicUrl = await this.asyncPublicUrlForImage();
        console.log(this.logPrefix(), "publicUrl: " + publicUrl);

        // Build the message for OpenAI
        const messages = [
            {
                role: "system",
                content: this.systemPrompt()
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: this.userPrompt()
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: publicUrl
                        }
                    }
                ]
            }
        ];

        const bodyJson = {
            model: this.evaluationModel(),
            messages: messages,
            max_completion_tokens: 8000  // High limit needed for gpt-5 which uses reasoning tokens internally
            // Note: temperature parameter not supported by some models (e.g., gpt-5) - uses default of 1
        };

        return bodyJson;
    }

    /**
   * @description Performs the actual evaluation with OpenAI.
   * @returns {Promise<void>}
   * @category Evaluation
   */
    async asyncPerformEvaluation () {
        const bodyJson = await this.asyncComposeBodyJson();

        console.log(this.logPrefix(), "Request body size:", JSON.stringify(bodyJson).length, "bytes");

        // Use OpenAiRequest for proper authentication, proxy handling, and error handling
        const request = OpenAiRequest.clone();
        request.setChatModel(Services.shared().openAiService().defaultChatModel());
        request.setBodyJson(bodyJson);
        request.setIsStreaming(false); // We want the complete response, not streaming
        request.setTimeoutPeriodInMs(30 * 60 * 1000); // 30 minutes for vision API (can be slow)

        // Store reference to underlying XHR for debugging
        this.setSvXhrRequest(request.currentXhrRequest());

        console.log(this.logPrefix(), "Sending request to OpenAI...");

        await request.asyncSendAndStreamResponse();

        if (request.error()) {
            throw new Error(`OpenAI API error: ${request.error().message}`);
        }

        // Parse the response
        const responseText = request.fullContent();
        if (!responseText) {
            throw new Error("No response received from OpenAI");
        }

        const response = JSON.parse(responseText);
        let checklist = response;

        try {
            this.setChecklist(checklist);
            this.assertValidChecklist();
            this.processChecklist();
        } catch (parseError) {
            console.error("Failed to parse evaluation response:", response);
            console.error("parseError:", parseError);
            throw new Error("Failed to parse evaluation results from OpenAI");
        }
    }

    assertValidChecklist () {
        const checklist = this.checklist();
        if (!Array.isArray(checklist)) {
            throw new Error("Invalid evaluation response: response must be an array");
        }

        if (checklist.length === 0) {
            throw new Error("Invalid evaluation response: checklist is empty");
        }

        checklist.forEach((item, index) => {
            if (!item.itemName || typeof item.itemName !== "string") {
                throw new Error(`Invalid checklist item ${index}: missing or invalid itemName`);
            }
            if (typeof item.score !== "number" || item.score < 0 || item.score > 1) {
                throw new Error(`Invalid checklist item ${index}: score must be a number between 0 and 1`);
            }
            if (!item.reasoning || typeof item.reasoning !== "string") {
                throw new Error(`Invalid checklist item ${index}: missing or invalid reasoning`);
            }
        });
    }

    processChecklist () {
        const checklist = this.checklist();
        console.log(this.logPrefix(), "checklist:", JSON.stringify(checklist, null, 2));

        // Calculate the final score from the checklist
        const sumOfScores = checklist.map((item) => item.score).sum();
        const numberOfItems = checklist.length;
        const finalScore = sumOfScores / numberOfItems;  // Average of all item scores

        this.setScore(finalScore);

        // Update the image with the score
        if (this.svImage()) {
            this.svImage().setTitle(finalScore.toFixed(2));  // Show as 0.75, 0.92, etc.
            //this.svImage().setSubtitle(reasoning);
        }
    }

    /**
   * @description Checks if the image contains all items from the prompt (even if imperfectly).
   * An item is considered "contained" if its score is > 0.
   * @returns {boolean} True if all checklist items have score > 0.
   * @category Evaluation
   */
    doesContainAllItems () {
        if (!this.checklist() || !Array.isArray(this.checklist())) {
            return false;
        }

        // Check if every item has a score > 0 (meaning it's present, even if imperfect)
        return this.checklist().every(item => item.score > 0);
    }

    /**
   * @description Gets the count of missing items (score = 0).
   * @returns {number} Number of items completely missing from the image.
   * @category Evaluation
   */
    missingItemCount () {
        if (!this.checklist() || !Array.isArray(this.checklist())) {
            return 0;
        }

        return this.checklist().filter(item => item.score === 0).length;
    }

    /**
   * @description Gets the names of missing items (score = 0).
   * @returns {Array<string>} Array of item names that are completely missing.
   * @category Evaluation
   */
    missingItemNames () {
        if (!this.checklist() || !Array.isArray(this.checklist())) {
            return [];
        }

        return this.checklist()
            .filter(item => item.score === 0)
            .map(item => item.itemName);
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
