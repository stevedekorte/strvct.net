"use strict";

/**
 * @module library.services.ImaginePro.Text_to_Image
 */

/**
 * @class ImagineProImagePrompt
 * @extends SvSummaryNode
 * @classdesc Represents an ImaginePro image prompt for generating images using Midjourney via ImaginePro API.
 *
 * IMPORTANT: This implementation ONLY supports Midjourney V7 or later versions.
 * We do NOT support V6 or earlier versions. All prompts will be sent with --v 7 flag.
 * Omnireference uses V7's --oref and --ow parameters (not V6's --cref/--cw).
 */
(class ImagineProImagePrompt extends SvSummaryNode {

    initPrototypeSlots () {

        // --- prompt ---

        /**
     * @member {string} prompt
     * @description The prompt text for image generation.
     * @category Input
     */
        {
            const slot = this.newSlot("prompt", "");
            slot.setInspectorPath("");
            slot.setAllowsNullValue(false);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
        }


        /**
     * @member {string} promptSuffix
     * @description Additional parameters to append to the prompt (e.g., "--no details --no frame").
     * @category Configuration
     */
        {
            const slot = this.newSlot("promptSuffix", "");
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
            slot.setLabel("Prompt Suffix");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setCanEditInspection(true);
            slot.setDescription("Additional Midjourney parameters to append (e.g., '--no details --no frame --chaos 50')");
        }

        // --- settings ---

        /**
     * @member {string} model
     * @description The model to use for text-to-image generation.
     * @category Configuration
     */
        {
            const slot = this.newSlot("model", "midjourney");
            slot.setInspectorPath("Settings");
            //slot.setLabel("Text to Image Model");
            slot.setLabel("Model");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(["midjourney"]);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
     * @member {string} aspectRatio
     * @description The aspect ratio of the generated image.
     * @category Configuration
     */
        {
            const slot = this.newSlot("aspectRatio", "1:1");
            slot.setInspectorPath("Settings");
            slot.setLabel("Aspect Ratio");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"]);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
     * @member {string} processMode
     * @description The processing mode for image generation.
     * @category Configuration
     */
        {
            const slot = this.newSlot("processMode", "turbo");
            slot.setInspectorPath("Settings");
            slot.setLabel("Process Mode");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(["relax", "fast", "turbo"]);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("key: value");
        }

        /**
         * @member {string} omniRefImageNode
         * @description Contains character reference sheet composite image for Midjourney V7+ omnireference.
         * This will be used with --oref parameter (V7's omnireference flag).
         * NOTE: We ONLY support V7 or later - V6's --cref is NOT supported.
         * @category Configuration
         */
        {
            const slot = this.newSlot("omniRefImageNode", null);
            slot.setInspectorPath("Settings");
            slot.setFinalInitProto("SvImageNode");
            slot.setLabel("Omniref Image Node");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("Contains character reference sheet composite image for Midjourney (Firebase Storage or other hosted URL)");
            slot.setSummaryFormat("key: value");
        }

        // omniRefWeight
        {
            const slot = this.newSlot("omniRefWeight", 100);
            slot.setInspectorPath("Settings");
            slot.setSlotType("Number");
            slot.setLabel("Omniref Weight");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setValidValues([25, 50, 75, 100, 150, 200, 300, 400, 600, 800, 1000]);
            slot.setDescription("Omnireference weight (1-1000): 25-50 subtle, 100-300 balanced, 400+ strong influence");
            slot.setSummaryFormat("key: value");
        }


        /**
     * @member {SvXhrRequest} xhrRequest
     * @description The current XHR request object for debugging.
     * @category Request
     */
        {
            const slot = this.newSlot("xhrRequest", null);
            slot.setShouldJsonArchive(true);
            slot.setInspectorPath("");
            slot.setLabel("xhr request");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setFinalInitProto(SvXhrRequest);
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        // --- generation ---

        /**
     * @member {string} error
     * @description The error message if any during image generation.
     * @category Status
     */
        {
            const slot = this.newSlot("error", null);
            slot.setAllowsNullValue(true);
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Error");
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key value");
        }


        /**
     * @member {string} status
     * @description The current status of the image generation process.
     * @category Status
     */
        {
            const slot = this.newSlot("status", "");
            slot.setLabel("Status");
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            //slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("key value");
        }

        /**
     * @member {ImagineProImageGenerations} generations
     * @description The generations for tracking task status.
     * @category Output
     */
        {
            const slot = this.newSlot("generations", null);
            slot.setFinalInitProto(ImagineProImageGenerations);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
            slot.setSlotType("ImagineProImageGenerations");
        }

        {
            const slot = this.newSlot("svImages", null);
            slot.setFinalInitProto(SvImages);
            slot.setLabel("Images");
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        /**
     * @member {Object} delegate
     * @description The delegate object for handling various events.
     * @category Delegation
     */
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
        }


        /**
     * @member {Action} generateAction
     * @description The action to trigger image generation.
     * @category Action
     */
        {
            const slot = this.newSlot("generateAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Generate");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("generate");
        }

        /**
     * @member {Action} clearAction
     * @description The action to clear the image prompt.
     * @category Action
     */
        {
            const slot = this.newSlot("clearAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Clear");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("clear");
        }

        {
            const slot = this.newSlot("completionPromise", null);
            slot.setSlotType("Promise");
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([]);
        this.setNodeCanAddSubnode(false);
        this.setCanDelete(true);
        this.setNodeCanReorderSubnodes(false);
    }

    setOmniRefImageUrl (url) {
        this.omniRefImageNode().setDataURL(url);
        return this;
    }

    /**
   * @description Gets the title for the image prompt.
   * @returns {string} The title.
   * @category Metadata
   */
    title () {
        const p = this.prompt().clipWithEllipsis(15);
        return p ? p : "Image Prompt";
    }

    /**
   * @description Gets the subtitle for the image prompt.
   * @returns {string} The subtitle.
   * @category Metadata
   */
    subtitle () {
        return this.status();
    }

    /**
   * @description Performs final initialization.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setCanDelete(true);
        this.omniRefImageNode().setTitle("Omniref Image");
    }

    /**
   * @description Gets the parent image prompts node.
   * @returns {Object} The parent image prompts node.
   * @category Hierarchy
   */
    imagePrompts () {
        return this.parentNode();
    }

    /**
   * @description Gets the ImaginePro service.
   * @returns {Object} The ImaginePro service.
   * @category Service
   */
    service () {
        return ImagineProService.shared();
    }

    /**
   * @description Checks if image generation can be performed.
   * @returns {boolean} True if generation can be performed, false otherwise.
   * @category Validation
   */
    canGenerate () {
        return this.prompt().length !== 0;
    }

    /**
   * @description Initiates the image generation process.
   * @category Action
   */
    async generate () {
        await this.start();
    }

    /**
   * @description Gets information about the generate action.
   * @returns {Object|Promise<Object>} The action information.
   * @category Action
   */
    generateActionInfo () {
        return {
            isEnabled: this.canGenerate(),
            isVisible: true
        };
    }

    /**
   * @description Sanitizes the prompt to avoid Midjourney parameter parsing issues and ImaginePro content moderation.
   * Replaces single dashes that could be interpreted as parameters with safe alternatives.
   * Also replaces words that trigger false positives in ImaginePro's overly aggressive content filter.
   * @param {string} prompt - The raw prompt text
   * @returns {string} The sanitized prompt
   * @category Utility
   */
    sanitizePromptForMidjourney (prompt) {
    // Replace dash followed by space with comma to avoid parameter interpretation
        prompt = prompt.replace(/\s-\s/g, ", ");

        // Also replace em-dash and en-dash with safe alternatives
        prompt = prompt.replace(/—/g, ", ");
        prompt = prompt.replace(/–/g, ", ");

        // Handle ImaginePro's overly aggressive content moderation
        // Replace problematic words that are falsely flagged in fantasy/game contexts
        // These replacements maintain the meaning while avoiding false positive rejections
        prompt = prompt
            .replace(/\bstone flesh\b/gi, "stone surface") // "stone flesh" -> "stone surface" (for golems)
            .replace(/\bflesh\b/gi, "form") // Generic "flesh" -> "form" as fallback
            .replace(/\bnaked\b/gi, "bare") // "naked" -> "bare" (for weapons, etc.)
            .replace(/\bkill\b/gi, "defeat") // "kill" -> "defeat" (for combat descriptions)
            .replace(/\bblood\b/gi, "crimson") // "blood" -> "crimson" (for visual descriptions)
            .replace(/\bgore\b/gi, "battle damage") // "gore" -> "battle damage"
            .replace(/\bcorpse\b/gi, "fallen figure") // "corpse" -> "fallen figure"
            .replace(/\bdead\b/gi, "fallen") // "dead" -> "fallen"
            .replace(/\bmurder\b/gi, "eliminate") // "murder" -> "eliminate"
            .replace(/\btorture\b/gi, "torment") // "torture" -> "torment"
            .replace(/\bsexy\b/gi, "attractive") // "sexy" -> "attractive"
            .replace(/\bsensual\b/gi, "graceful") // "sensual" -> "graceful"
            .replace(/\bviolent\b/gi, "intense") // "violent" -> "intense"
            .replace(/\bbloody\b/gi, "crimson") // "bloody" -> "crimson"
            .replace(/\bbrutal\b/gi, "fierce"); // "brutal" -> "fierce"

        return prompt;
    }

    async composeFullPrompt () {
        let prompt = this.prompt();
        prompt = this.sanitizePromptForMidjourney(prompt);

        // Append prompt suffix if provided (e.g., "--no details --no frame")
        const suffix = this.promptSuffix();
        if (suffix.trim().length > 0) {
            prompt += " " + suffix.trim();
        }

        // Append omnireference flags if image is provided
        // IMPORTANT: We ONLY support Midjourney V7 or later versions
        // V7 uses --oref (omnireference) and --ow (omnireference weight) parameters
        // We do NOT support V6 or earlier (which used --cref/--cw)
        if (this.omniRefImageNode().hasImage()) {
            const publicUrl = await this.omniRefImageNode().asyncPublicUrl();
            prompt += " --oref " + publicUrl + " --ow " + this.omniRefWeight();
        }

        // Append aspect ratio
        const aspectRatio = this.aspectRatio();
        if (aspectRatio && aspectRatio !== "1:1") {
            prompt += " --ar " + aspectRatio;
        }

        // IMPORTANT: We require Midjourney V7 or later
        // Append version flag to ensure V7 is used
        prompt += " --v 7";

        console.log("composeFullPrompt: [\n" + prompt + "\n]");
        return prompt;
    }

    /**
   * @description Starts the image generation process.
   * @category Process
   */
    async start () {
        this.setCompletionPromise(Promise.clone());
        this.setError(null);
        this.setStatus("submitting task...");
        this.sendDelegateMessage("onImagePromptStart", [this]);

        const apiKey = await this.service().apiKeyOrUserAuthToken();
        const endpoint = "https://api.imaginepro.ai/api/v1/nova/imagine";

        const bodyJson = {
            prompt: await this.composeFullPrompt(),
            process_mode: this.processMode()
        };

        // IMPORTANT: Always use proxy for ImaginePro API requests:
        // 1. ACCOUNTING: Tracks API usage for user billing
        // 2. AUTHENTICATION: Handles API key management securely
        // 3. CORS: Ensures proper headers for cross-origin requests
        const proxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(endpoint);
        const request = SvXhrRequest.clone();
        request.setDelegate(this);
        request.setUrl(proxyEndpoint);
        request.setMethod("POST");
        request.setHeaders({
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        });
        request.setBody(JSON.stringify(bodyJson));

        // Store request for debugging
        this.setXhrRequest(request);

        try {
            await request.asyncSend(); // Delegate methods handle errors

            if (request.hasError()) {
                this.setError(request.error());
            } else {
                const responseJson = JSON.parse(request.responseText());
                const taskId = responseJson.task_id || responseJson.messageId;
                if (taskId) {
                    await this.addGenerationForTaskId(taskId);
                } else {
                    throw new Error("No task_id or messageId returned from ImaginePro");
                }
            }
        } catch (error) {
            this.onError(error);
        }
        this.onPromptEnd();
    }

    async addGenerationForTaskId (taskId) {
        this.setStatus("task submitted, awaiting completion...");
        const generation = this.generations().add();
        generation.setPromptNote(this.composeFullPrompt());
        generation.setTaskId(taskId);
        generation.setDelegate(this);
        await generation.asyncStartPolling();
    }

    /**
   * @description Handles the end of the image generation process.
   * @category Process
   */
    onPromptEnd () { // end of request to being task
        this.sendDelegateMessage("onImagePromptEnd", [this]);
    }

    // --- SvXhrRequest Delegate Methods ---

    /**
   * @description Called during request progress.
   * @param {SvXhrRequest} request - The request object.
   * @category Request Delegation
   */
    onRequestProgress (request) {
        this.setStatus(`uploading: ${request.contentByteCount()} bytes`);
    }

    /**
   * @description Shuts down the image prompt and its associated images.
   * @returns {ImagineProImagePrompt} The current instance.
   * @category Lifecycle
   */
    shutdown () {
        this.nodeShutdown();
        return this;
    }

    allResultImages () {
        return this.generations().subnodes().map(generation => generation.images().subnodes()).flat();
    }

    resultImageUrlData () {
        const image = this.allResultImages().last();
        if (image) {
            return image.dataUrl();
        }
        return null;
    }

    /// --- Actions ---

    clear () {
        this.setStatus("");
        this.setError(null);
        this.shutdown();
        this.generations().removeAllSubnodes();
        //this.svImages().removeAllSubnodes();
    }

}.initThisClass());
