/**
 * @module library.services.ImaginePro
 */

/**
 * @class ImageEvalChecklistMaker
 * @extends SvSummaryNode
 * @classdesc Generates a checklist from an image prompt using AI chat models.
 * This class analyzes an image generation prompt and creates a structured checklist
 * of elements that should be present in the generated image.
 * Supports multiple AI models including OpenAI, Anthropic, Gemini, and others.
 */
"use strict";

(class ImageEvalChecklistMaker extends SvSummaryNode {

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {

        /**
         * @member {string} imagePromptText
         * @description The image generation prompt to analyze.
         * @category Configuration
         */
        {
            const slot = this.newSlot("imagePromptText", "");
            slot.setSlotType("String");
            slot.setLabel("Image Prompt Text");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("The image generation prompt to analyze");
        }

        /**
         * @member {Array} checklistArray
         * @description The generated checklist as an array of item objects.
         * @category Results
         */
        {
            const slot = this.newSlot("checklistArray", null);
            slot.setSlotType("Array");
            slot.setLabel("Checklist Array");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setAllowsNullValue(true);
            slot.setDescription("Generated checklist as array of objects");
        }

        /**
         * @member {string} evaluationModel
         * @description The AI chat model to use for checklist generation.
         * @category Configuration
         */
        {
            //const chatModelNames = Services.shared().chatModelNames();
            const slot = this.newSlot("evaluationModel", "gemini-2.5-flash-lite"); // cheap and fastest
            slot.setSlotType("String");
            slot.setLabel("Evaluation Model");
            slot.setIsSubnodeField(false);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidValuesClosure(() => {
                return Services.shared().chatModelNames();
            });
            //slot.setValidValues(["gpt-5"]);
            slot.setDescription("Chat model use to generate checklist from image prompt");
        }

        /**
         * @member {string} status
         * @description Current status of the checklist generation.
         * @category Status
         */
        {
            const slot = this.newSlot("status", "");
            slot.setSlotType("String");
            slot.setLabel("Status");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDescription("Current generation status");
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {Error} error
         * @description Any error that occurred during generation.
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
            slot.setDescription("Error from generation process");
            slot.setSummaryFormat("key: value");
        }
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Checklist Maker");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeSubtitleIsChildrenSummary(true);
    }

    aiChatModel () {
        return Services.shared().chatModelWithName(this.evaluationModel());
    }

    /**
     * @description System prompt for checklist generation.
     * @returns {string} The system prompt.
     * @category Prompts
     */
    systemPrompt () {
        return `You are an expert at analyzing image generation prompts. Your task is to create a detailed checklist of elements that should be present in an image generated from the given prompt.

Parse the generation prompt to identify:
- Objects/subjects that should be present (e.g., "a cat", "mountains", "a sword")
- Actions/poses described (e.g., "sitting", "flying", "wielding")
- Attributes/descriptors (e.g., "red", "ancient", "glowing")
- Settings/environments (e.g., "in a forest", "at sunset", "underwater")
- Compositional elements (e.g., "in the foreground", "surrounded by", "facing left")

IMPORTANT: Return ONLY a JSON array. Do not include any explanatory text, markdown formatting, or code blocks.

Each item in the array should have:
- "itemName": A concise description of what should be present
- "importance": A value from 0.0 to 1.0 indicating how critical this element is (1.0 = essential, 0.5 = moderate, 0.0 = minor detail)

Example output format:
[
    {
        "itemName": "glowing effect on sword",
        "importance": 0.8
    },
    {
        "itemName": "birds in background",
        "importance": 0.3
    }
]`;
    }

    /**
     * @description User prompt for checklist generation.
     * @returns {string} The user prompt.
     * @category Prompts
     */
    userPrompt () {
        return `Image Generation Prompt:
"${this.imagePromptText()}"

Please create a detailed checklist of elements that should be present in an image generated from this prompt.`;
    }

    /**
     * @description Generates a checklist from the image prompt.
     * @returns {Promise<ImageEvalChecklistMaker>} Returns this for chaining.
     * @category Actions
     */
    async generateChecklist () {
        try {
            this.setChecklistArray(null);
            this.setStatus("Generating checklist...");
            this.setError(null);

            if (!this.imagePromptText()) {
                throw new Error("Image prompt text is required");
            }

            await this.asyncPerformGeneration();

            this.setStatus("Checklist generated");

        } catch (error) {
            console.error("Checklist generation error:", error);
            this.setError(error);
            this.setStatus("Generation failed");
            throw error;
        }

        return this;
    }

    /**
     * @description Performs the actual checklist generation with the selected AI model.
     * @returns {Promise<void>}
     * @category Generation
     */
    async asyncPerformGeneration () {
        const bodyJson = {
            model: this.evaluationModel(),
            messages: [
                {
                    role: "system",
                    content: this.systemPrompt()
                },
                {
                    role: "user",
                    content: this.userPrompt()
                }
            ]
            // Note: Token limits are added by each service's setupForStreaming() method
            // OpenAI uses max_completion_tokens, Anthropic uses max_tokens, Gemini uses outputTokenLimit in generation_config
        };

        // Use the chat model's request for proper authentication and proxy handling
        const request = this.aiChatModel().newChatRequest();

        assert(request.isKindOf(GeminiRequest), "request is not a kind of GeminiRequest");

        request.setBodyJson(bodyJson);
        request.setIsStreaming(false);
        request.setTimeoutPeriodInMs(60 * 1000); // 1 minute timeout

        console.log(this.logPrefix(), "Sending checklist generation request to", this.evaluationModel() + "...");

        await request.asyncSendAndStreamResponse();

        if (request.error()) {
            throw new Error(`AI API error: ${request.error().message}`);
        }

        // Parse the response
        let responseText = request.fullContent();
        if (!responseText) {
            throw new Error("No response received from AI model");
        }

        // Some models (e.g., Claude) wrap JSON in markdown code blocks
        // Try to extract JSON from markdown if present
        const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (jsonMatch) {
            responseText = jsonMatch[1];
        }

        let checklistData;
        try {
            checklistData = JSON.parse(responseText);
        } catch (parseError) {
            console.error("parseError:", parseError);
            console.error("Failed to parse checklist response:", responseText);
            throw new Error("Failed to parse checklist results from AI model");
        }

        if (!Array.isArray(checklistData)) {
            throw new Error("Expected checklist to be an array");
        }

        this.setChecklistArray(checklistData);
        console.log(this.logPrefix(), "Generated checklist with", checklistData.length, "items");
    }

    /**
     * @description Gets the subtitle for this maker.
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

        if (this.checklistArray()) {
            return `${this.checklistArray().length} checklist items`;
        }

        return "Ready to generate";
    }

    /**
     * @description Static test method to verify checklist generation functionality.
     * @returns {Promise<void>}
     * @category Testing
     * @static
     */
    static async asyncTest () {
        console.log(this.logPrefix() + ".asyncTest() starting...");

        const testPrompt = "A majestic dragon perched on a mountain peak at sunset, with golden scales reflecting the light, wings spread wide, breathing a small plume of fire into the sky, surrounded by ancient ruins covered in moss.";

        const maker = this.clone();
        maker.setImagePromptText(testPrompt);

        console.log(this.logPrefix() + ".asyncTest() generating checklist for prompt:", testPrompt);

        try {
            await maker.generateChecklist();

            const checklist = maker.checklistArray();
            assert(checklist.length > 0, "Checklist should have at least one item");

            console.log(this.logPrefix() + ".asyncTest() generated", checklist.length, "checklist items:");

            checklist.forEach((item, index) => {
                assert(Type.isString(item.itemName), "Item name should be a string");
                assert(Type.isNumber(item.importance), "Importance should be a number");
                console.log(`  ${index + 1}. ${item.itemName} (importance: ${item.importance})`);
            });

            console.log(this.logPrefix() + ".asyncTest() completed successfully");
        } catch (error) {

            console.error(this.logPrefix() + ".asyncTest() failed:", error);
            throw error;
        }
    }

}).initThisClass();
