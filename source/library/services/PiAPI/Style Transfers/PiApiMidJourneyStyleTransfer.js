"use strict";

/**
 * @module library.services.PiAPI.StyleTransfers
 */

/**
 * @class PiApiMidJourneyStyleTransfer
 * @extends SvSummaryNode
 * @classdesc How it works:
 * - Takes a text prompt
 * - Uses OpenAiImagePrompt to generate an initial image
 * - Uses PiApiImagePrompt with Midjourney's --sref parameter to perform style transfer
 * - Stores the style transferred image as a urlData
 * - Disposes of the OpenAiImagePrompt and PiApiImagePrompt objects
 * 
 * Delegate messages sent:
 * - onImagePromptLoading
 * - onImagePromptError
 * - onImagePromptImageLoaded
 * - onImagePromptImageError
 * - onImagePromptEnd
 * 
 * (the delegate will typically be a UoImageMessage)
 */

(class PiApiMidJourneyStyleTransfer extends SvSummaryNode {
    /**
     * @description Initializes the prototype slots for the PiApiMidJourneyStyleTransfer class.
     */
    initPrototypeSlots () {

        // Text prompt
        {
            const slot = this.newSlot("prompt", "");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }

        // OpenAI image generation prompt
        {
            const slot = this.newSlot("openAiPrompt", null);
            slot.setFinalInitProto(OpenAiImagePrompt);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // PiAPI Midjourney prompt
        {
            const slot = this.newSlot("piApiPrompt", null);
            slot.setFinalInitProto(PiApiImagePrompt);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // Style reference image using Leonardo's S3 upload
        {
            const slot = this.newSlot("styleRefImage", null);
            slot.setFinalInitProto(LeonardoRefImage);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // Style weight (0-1000, default 100)
        {
            const slot = this.newSlot("styleWeight", null);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidItems([
                { value: 0,    label: "None (0)" },
                { value: 20,   label: "Very Subtle (20)" },
                { value: 50,   label: "Subtle (50)" },
                { value: 100,  label: "Moderate - Default (100)" },
                { value: 200,  label: "Strong (200)" },
                { value: 350,  label: "Very Strong (350)" },
                { value: 500,  label: "Intense (500)" },
                { value: 750,  label: "Very Intense (750)" },
                { value: 1000, label: "Maximum (1000)" }
            ]);
            slot.setInitValue(100);
        }

        // Process mode for Midjourney
        {
            const slot = this.newSlot("processMode", "relax");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidValues(["relax", "fast", "turbo"]);
        }

        // Aspect ratio
        {
            const slot = this.newSlot("aspectRatio", "1:1");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidValues(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"]);
        }

        // Final result data URL
        {
            const slot = this.newSlot("resultDataUrl", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setFieldInspectorViewClassName("SvImageWellField");
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

        // Start action
        {
            const slot = this.newSlot("startAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Start Style Transfer");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("start");
        }

        // Set style image action
        {
            const slot = this.newSlot("setStyleImageAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Set Style Image");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("selectStyleImage");
        }

        // Delegate
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setTitle("Midjourney Style Transfer");
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([]);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(true);
        this.setNodeFillsRemainingWidth(false);
    }

    finalInit () {
        super.finalInit();
        this.openAiPrompt().setTitle("OpenAI Image Generation");
        this.piApiPrompt().setTitle("Midjourney Style Transfer");
        this.styleRefImage().setTitle("Style Reference Image");
        this.setNodeFillsRemainingWidth(false);
    }

    /**
     * @description Gets the PiAPI service.
     * @returns {Object} The service.
     * @category Service
     */
    piApiService () {
        return PiApiService.shared();
    }

    /**
     * @description Gets the OpenAI service.
     * @returns {Object} The service.
     * @category Service
     */
    openAiService () {
        return OpenAiService.shared();
    }

    /**
     * @description Sets up the initial OpenAI prompt.
     * @returns {Object} The configured OpenAI prompt.
     * @category Setup
     */
    setupInitialPrompt () {
        const openAiPrompt = this.openAiPrompt();
        openAiPrompt.setPrompt(this.prompt());
        openAiPrompt.setTtiModel("gpt-image-1");
        openAiPrompt.setQuality("standard");
        openAiPrompt.setImageCount(1);
        return openAiPrompt;
    }

    /**
     * @description Sets up the PiAPI Midjourney prompt with style reference.
     * @param {string} initialImageUrl - The URL of the initial generated image.
     * @param {string} styleImageS3Url - The S3 URL of the style reference image.
     * @returns {Object} The configured PiAPI prompt.
     * @category Setup
     */
    setupPiApiPrompt (initialImageUrl, styleImageS3Url) {
        const piApiPrompt = this.piApiPrompt();
        
        // Build the prompt with style reference
        let fullPrompt = this.prompt();
        
        // Add the style reference from S3
        if (styleImageS3Url) {
            fullPrompt += ` --sref ${styleImageS3Url}`;
            
            // Add style weight if not default
            if (this.styleWeight() !== 100) {
                fullPrompt += ` --sw ${this.styleWeight()}`;
            }
        }
        
        // If we want to use the initial image as a base, we can add it as image reference
        if (initialImageUrl) {
            fullPrompt += ` --iref ${initialImageUrl}`;
        }
        
        piApiPrompt.setPrompt(fullPrompt);
        piApiPrompt.setModel("midjourney");
        piApiPrompt.setAspectRatio(this.aspectRatio());
        piApiPrompt.setProcessMode(this.processMode());
        
        return piApiPrompt;
    }

    /**
     * @description Gets the S3 URL for the style reference image.
     * @returns {string} The S3 URL or null if not uploaded.
     * @category Helper
     */
    getStyleImageS3Url () {
        const styleRef = this.styleRefImage();
        if (styleRef && styleRef.hasInitImageId()) {
            // Construct the S3 URL from the init image ID
            // Leonardo stores images at: https://leonardo-prod-init-images.s3.amazonaws.com/init-images/{id}.{ext}
            const initImageDict = styleRef.initImageDict();
            if (initImageDict && initImageDict.fields && initImageDict.fields.key) {
                // The key contains the full path: "init-images/{id}.{ext}"
                return `https://leonardo-prod-init-images.s3.amazonaws.com/${initImageDict.fields.key}`;
            }
        }
        return null;
    }

    /**
     * @description Checks if there's an error.
     * @returns {boolean} True if there's an error, false otherwise.
     * @category Error Handling
     */
    hasError () {
        return this.error() !== "" && this.error() !== null;
    }

    /**
     * @description Starts the style transfer process.
     * @returns {Promise<void>}
     * @category Actions
     */
    async start () {
        try {
            this.setError("");
            this.setStatus("starting style transfer...");
            
            // Validate inputs
            if (!this.prompt() || this.prompt().trim() === "") {
                throw new Error("Prompt is required");
            }
            
            const styleRef = this.styleRefImage();
            if (!styleRef || !styleRef.hasDataUrl()) {
                throw new Error("Style reference image is required");
            }
            
            // Step 1: Upload style image to S3 if not already uploaded
            let styleImageS3Url = this.getStyleImageS3Url();
            if (!styleImageS3Url) {
                this.setStatus("uploading style image to S3...");
                
                // Upload the style image to Leonardo's S3
                await styleRef.getIdAndUpload();
                
                if (!styleRef.hasInitImageId()) {
                    throw new Error("Failed to upload style image to S3");
                }
                
                styleImageS3Url = this.getStyleImageS3Url();
                if (!styleImageS3Url) {
                    throw new Error("Failed to get S3 URL for style image");
                }
            }
            
            // Step 2: Generate initial image with OpenAI
            this.setStatus("generating initial image with OpenAI...");
            this.sendDelegate("onImagePromptLoading");
            
            const openAiPrompt = this.setupInitialPrompt();
            openAiPrompt.setDelegate(this);
            await openAiPrompt.generate();
            
            if (!openAiPrompt.images() || openAiPrompt.images().subnodeCount() === 0) {
                throw new Error("Failed to generate initial image");
            }
            
            // Get the generated image URL
            const openAiImage = openAiPrompt.images().subnodes().last();
            const initialImageUrl = openAiImage.imageUrl();
            
            if (!initialImageUrl) {
                throw new Error("Failed to get image URL from OpenAI");
            }
            
            // Step 3: Apply style transfer with Midjourney via PiAPI
            this.setStatus("performing style transfer with Midjourney...");
            
            const piApiPrompt = this.setupPiApiPrompt(initialImageUrl, styleImageS3Url);
            piApiPrompt.setDelegate(this);
            
            await piApiPrompt.generate();
            
            // PiAPI uses async polling, so we need to wait for the generation to complete
            // The delegate methods will handle the completion
            
        } catch (error) {
            this.setError(error.message);
            this.setStatus("failed");
            this.sendDelegate("onImagePromptError");
        }
    }

    // Delegate methods from OpenAI prompt
    onImagePromptCompleted (/*prompt*/) {
        // Called when OpenAI finishes generating
        console.log("OpenAI image generation completed");
    }

    onImagePromptError (prompt) {
        // Called if OpenAI fails
        if (prompt === this.openAiPrompt()) {
            this.setError("OpenAI generation failed: " + prompt.error());
        } else {
            this.setError("Midjourney style transfer failed: " + prompt.error());
        }
        this.setStatus("failed");
        this.sendDelegate("onImagePromptError");
    }

    // Delegate methods from PiAPI prompt
    onImagePromptSuccess (prompt) {
        if (prompt === this.piApiPrompt()) {
            // Midjourney generation completed successfully
            const images = prompt.images();
            if (images && images.subnodeCount() > 0) {
                const finalImage = images.subnodes().last();
                if (finalImage && finalImage.imageUrl()) {
                    this.setResultDataUrl(finalImage.imageUrl());
                    this.setStatus("style transfer complete");
                    this.sendDelegate("onImagePromptImageLoaded", [this, finalImage]);
                } else {
                    this.setError("Failed to get final image URL from Midjourney");
                    this.setStatus("failed");
                    this.sendDelegate("onImagePromptError");
                }
            }
        }
    }

    onImagePromptImageLoaded (prompt, aiImage) {
        // Called when an individual image loads
        if (prompt === this.piApiPrompt()) {
            this.setResultDataUrl(aiImage.imageUrl());
            this.setStatus("style transfer complete");
            this.sendDelegate("onImagePromptImageLoaded", [this, aiImage]);
            this.sendDelegate("onImagePromptEnd", [this]);
        }
    }

    onImagePromptImageError (prompt, aiImage) {
        // Called if an image fails to load
        this.setError("Image loading failed: " + aiImage.error());
        this.setStatus("failed");
        this.sendDelegate("onImagePromptImageError", [this, aiImage]);
    }

    onImagePromptEnd (prompt) {
        // Called when the prompt process ends
        if (prompt === this.piApiPrompt()) {
            this.sendDelegate("onImagePromptEnd", [this]);
        }
    }

    /**
     * @description Checks if the style transfer process can be started.
     * @returns {boolean} True if can start, false otherwise.
     * @category Status
     */
    canStart () {
        const styleRef = this.styleRefImage();
        return this.prompt() !== null && 
               this.prompt().trim() !== "" && 
               styleRef !== null &&
               styleRef.hasDataUrl() &&
               this.status() !== "processing";
    }

    /**
     * @description Checks if the style transfer has a result.
     * @returns {boolean} True if has result, false otherwise.
     * @category Status
     */
    hasResult () {
        return this.resultDataUrl() !== null;
    }

    /**
     * @description Shuts down the style transfer process.
     * @returns {this} The current instance.
     * @category Lifecycle
     */
    shutdown () {
        if (this.openAiPrompt()) {
            this.openAiPrompt().shutdown();
        }
        if (this.piApiPrompt()) {
            this.piApiPrompt().shutdown();
        }
        return this;
    }

    /**
     * @description Selects a style image from file.
     * @returns {Promise<void>}
     * @category Actions
     */
    async selectStyleImage () {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            const fileSelected = new Promise((resolve, reject) => {
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    } else {
                        reject(new Error('No file selected'));
                    }
                };
            });
            
            input.click();
            const dataUrl = await fileSelected;
            
            // Store the data URL in the style reference image
            // It will be uploaded to S3 when we start the process
            const styleRef = this.styleRefImage();
            styleRef.setDataUrl(dataUrl);
            styleRef.setImageLabel("Style reference for Midjourney");
            
            this.setStatus("Style image selected - will upload to S3 on start");
            
        } catch (error) {
            console.error("Failed to select style image:", error);
        }
    }

    /**
     * @description Gets action info for the start action.
     * @returns {Object} Action info.
     * @category Actions
     */
    startActionInfo () {
        return {
            isEnabled: this.canStart(),
            isVisible: true
        };
    }

    /**
     * @description Gets action info for the set style image action.
     * @returns {Object} Action info.
     * @category Actions
     */
    setStyleImageActionInfo () {
        return {
            isEnabled: true,
            isVisible: true
        };
    }

    /**
     * @description Resets the style transfer for a new attempt.
     * @returns {this} The current instance.
     * @category Actions
     */
    reset () {
        this.setError("");
        this.setStatus("");
        this.setResultDataUrl(null);
        
        if (this.openAiPrompt()) {
            this.openAiPrompt().shutdown();
        }
        
        if (this.piApiPrompt()) {
            this.piApiPrompt().shutdown();
        }
        
        return this;
    }

    /**
     * @description Gets a descriptive subtitle based on current state.
     * @returns {string} The subtitle.
     * @category UI
     */
    subtitle () {
        if (this.hasError()) {
            return "Error: " + this.error();
        }
        
        if (this.hasResult()) {
            return "Complete";
        }
        
        if (this.status()) {
            return this.status();
        }
        
        const styleRef = this.styleRefImage();
        if (styleRef) {
            if (styleRef.hasInitImageId()) {
                return "Style uploaded to S3";
            } else if (styleRef.hasDataUrl()) {
                return "Style image ready (not uploaded)";
            }
        }
        
        return "Ready";
    }

    /**
     * @description Sends a delegate method call.
     * @param {string} methodName - The name of the method to call.
     * @param {Array} args - The arguments to pass to the method.
     * @returns {boolean} True if the delegate method was called, false otherwise.
     * @category Delegation
     */
    sendDelegate (methodName, args = [this]) {
        const d = this.delegate();
        if (d) {
            const f = d[methodName];
            if (f) {
                f.apply(d, args);
                return true;
            }
        }
        return false;
    }

    /**
     * @description Copies error to clipboard.
     * @category Actions
     */
    copyErrorToClipboard () {
        const error = this.error();
        if (error) {
            navigator.clipboard.writeText(error);
        }
    }

    /**
     * @description Gets action info for copy error to clipboard.
     * @returns {Object} Action info.
     * @category Actions
     */
    copyErrorToClipboardActionInfo () {
        return {
            isEnabled: this.hasError(),
            isVisible: this.hasError()
        };
    }

}.initThisClass());