/**
 * @module library.services.ImaginePro
 */

/**
 * @class ImagesEvaluator
 * @extends SvSummaryNode
 * @classdesc Evaluates a collection of images using OpenAI's vision model based on custom prompts.
 * This class provides a generic image evaluation framework that can be used to score
 * and select images based on any criteria defined in the evaluator prompt.
 */
"use strict";

(class ImagesEvaluator extends SvSummaryNode {

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {SvImageNodes} svImageNodes
     * @description Collection of images to evaluate.
     * @category Data
     */
        {
            const slot = this.newSlot("svImageNodes", null);
            slot.setFinalInitProto(SvImageNodes);
            slot.setSlotType("SvImageNodes");
            slot.setLabel("Images");
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDescription("Collection of images to evaluate");
        }

        /**
     * @member {string} imageGenPrompt
     * @description The prompt that was used to generate the images.
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
            slot.setDescription("The prompt that was used to generate the images");
        }

        /**
     * @member {string} evaluatorPrompt
     * @description The prompt to use for evaluating the images.
     * @category Configuration
     */
        {
            const slot = this.newSlot("evaluatorPrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Evaluator Prompt");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("The prompt to use for evaluating the images with OpenAI");
        }

        /**
     * @member {Array} evaluationResults
     * @description Results from the evaluation process.
     * @category Results
     */
        {
            const slot = this.newSlot("evaluationResults", null);
            slot.setSlotType("Array");
            slot.setLabel("Evaluation Results");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setInitValue([]);
            slot.setDescription("Array of evaluation results for each image");
        }

        /**
     * @member {number} bestImageIndex
     * @description Index of the best scoring image.
     * @category Results
     */
        {
            const slot = this.newSlot("bestImageIndex", null);
            slot.setSlotType("Number");
            slot.setLabel("Best Image Index");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(true);
            slot.setDescription("Index of the highest scoring image");
        }

        /**
     * @member {SvImage} bestImage
     * @description The best scoring image.
     * @category Results
     */
        {
            const slot = this.newSlot("bestImage", null);
            slot.setSlotType("SvImage");
            slot.setLabel("Best Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(true);
            slot.setDescription("The highest scoring image from the evaluation");
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

        {
            const slot = this.newSlot("checklistItemNodes", null);
            slot.setFinalInitProto(SvSummaryNode);
            slot.setLabel("Checklist Items");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(true);
            slot.setDescription("Components of the image prompt");
        }

        // Action to evaluate images
        {
            const slot = this.newSlot("evaluateAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Evaluate Images");
            slot.setCanInspect(true);
            slot.setIsAction(true);
        }
    }

    /**
   * @description Initializes the prototype.
   * @category Initialization
   */
    initPrototype () {
        this.setTitle("Images Evaluator");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
    }


    /**
   * @description Action to evaluate the images.
   * @returns {Promise<ImagesEvaluator>} Returns this for chaining.
   * @category Actions
   */
    async evaluateAction () {
        await this.evaluate();
        return this;
    }

    issuesArray () {
        const issues = [];

        if (!this.svImageNodes() || this.svImageNodes().imageCount() === 0) {
            issues.push("No images to evaluate");
        }

        if (!this.imageGenPrompt()) {
            issues.push("Image generation prompt is required");
        }

        if (!this.evaluatorPrompt()) {
            issues.push("Evaluator prompt is required");
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
        assert(issuesMsg, "Issues found: " + issuesMsg);
    }

    setSvImageNodes (svImageNodes) {
        this.svImageNodes().removeAllImages();
        this.svImageNodes().addImages(svImageNodes);
        return this;
    }

    clearEvaluationResults () {
        this.setStatus("");
        this.setError(null);
        this.setEvaluationResults([]);
        this.setBestImageIndex(null);
        this.setBestImage(null);
    }

    /**
   * @description Main evaluation method.
   * @returns {Promise<ImagesEvaluator>} Returns this for chaining.
   * @category Evaluation
   */
    async evaluate () {
        try {
            this.clearEvaluationResults();
            this.setStatus("Starting evaluation...");

            this.assertReadyToEvaluate();

            this.setStatus("Evaluating images with OpenAI...");

            // Perform evaluation
            await this.asyncPerformEvaluation();

            // Select best image
            this.selectBestImage();

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
        return `You are an expert image evaluator. You will evaluate and RANK images based on how accurately they match the generation prompt.

    SCORING METHODOLOGY:
    1. First, create a checklist by parsing the generation prompt to identify:
       - Objects/subjects that should be present (e.g., "a cat", "mountains", "a sword")
       - Actions/poses described (e.g., "sitting", "flying", "wielding")
       - Attributes/descriptors (e.g., "red", "ancient", "glowing")
       - Settings/environments (e.g., "in a forest", "at sunset", "underwater")
       - Compositional elements (e.g., "in the foreground", "surrounded by", "facing left")
    
    2. For EACH image, check off which elements from your checklist are present and correctly depicted
    
    3. Calculate the base score:
       Score = (Elements Present / Total Elements) × 100
    
    4. Apply quality adjustments (-10 to +10 points total):
       - Technical quality (sharpness, lighting, coherence): -5 to +5
       - Artistic merit (composition, aesthetics): -5 to +5
    
    5. Ensure relative ranking: After scoring all images, verify that scores reflect meaningful differences

    Return your evaluation as a JSON array:
    [
      {
        "index": 0,
        "score": 85,
        "checklist": {
          "total_elements": 12,
          "elements_present": 10,
          "missing": ["glowing effect on sword", "birds in background"]
        },
        "reasoning": "10/12 prompt elements present (83%). +2 for excellent composition. Missing: glowing sword effect, background birds."
      },
      ...
    ]
    
    Scores should meaningfully differentiate between images. An image with all elements should score 90-100, while one missing half the elements should score around 50.`;
    }

    async asyncComposeUserPrompt () {
        const publicUrls = await this.svImageNodes().asyncPublicUrls(); // will be in parallel

        const userPrompt = `Original Image Generation Prompt:
        "${this.imageGenPrompt()}"
        
        Evaluation Criteria:
        ${this.evaluatorPrompt()}
    
        Please evaluate the ${publicUrls.length} images provided and return scores in the JSON format specified.`;
        return userPrompt;
    }

    async asyncComposeBodyJson () {
        const userPrompt = await this.asyncComposeUserPrompt();

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
                        text: userPrompt
                    }
                ]
            }
        ];

        // Add images to the message
        publicUrls.forEach((url /*, index*/) => {
            messages[1].content.push({
                type: "image_url",
                image_url: {
                    url: url
                }
            });
        });

        // Make the API call
        const bodyJson = {
            model: this.evaluationModel(),
            messages: messages,
            max_tokens: 1000,
            temperature: 0.3
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
        const apiKey = await OpenAiService.shared().apiKeyOrUserAuthToken();

        const request = SvXhrRequest.clone();
        request.setUrl("https://api.openai.com/v1/chat/completions");
        request.setMethod("POST");
        request.setHeaders({
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        });
        request.setBody(JSON.stringify(bodyJson));

        await request.asyncSend();

        if (!request.isSuccess()) {
            throw new Error(`OpenAI API error: ${request.statusText()}`);
        }

        // Parse the response
        const response = JSON.parse(request.responseText());
        const content = response.choices[0].message.content;

        // Extract JSON from the response
        let evaluationData;
        try {
            // Try to find JSON in the response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                evaluationData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON array found in response");
            }
        } catch (parseError) {
            console.error("Failed to parse evaluation response:", content);
            console.error("parseError:", parseError);
            throw new Error("Failed to parse evaluation results from OpenAI");
        }

        this.setEvaluationResults(evaluationData);

        evaluationData.forEach((result) => {
            const imageNode = this.svImageNodes().subnodeWithIndex(result.index);
            imageNode.setSubtitle(result.reasoning);
            imageNode.setTitle(String(result.score));
        });
    }

    /**
   * @description Finds the best image based on evaluation scores.
   * @returns {void}
   * @category Evaluation
   */
    bestSvImageNode () {
        let bestNode = null;
        let bestScore = -1;
        this.svImageNodes().forEach((node) => {
            const score = node.title().asNumber();
            if (score > bestScore) {
                bestNode = node.svImage();
                bestScore = score;
            }
        });
        return bestNode;
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

        const bestNode = this.bestSvImageNode();

        if (bestNode) {
            return "Best score: " + bestNode.title();
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
            isEnabled: this.svImageNodes() &&
                 this.svImageNodes().imageCount() > 0 &&
                 this.imageGenPrompt() &&
                 this.evaluatorPrompt(),
            isVisible: true,
            title: "Evaluate Images",
            subtitle: this.svImageNodes() ? `Evaluate ${this.svImageNodes().imageCount()} images` : "No images"
        };
    }

}).initThisClass();
