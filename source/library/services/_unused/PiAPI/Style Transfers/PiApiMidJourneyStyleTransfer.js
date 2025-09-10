"use strict";

/**
 * @module library.services.PiAPI.StyleTransfers
 */

/**
 * @class PiApiMidJourneyStyleTransfer
 * @extends SvSummaryNode
 * @classdesc Simplified style transfer workflow:
 * - Takes two prompts: content prompt and style prompt
 * - Generates content image with OpenAI (literal interpretation)
 * - Uploads to Firebase Storage for public URL access
 * - Applies style to the OpenAI image using Midjourney with format:
 *   {image_url} in the style of {style_prompt}
 * - Supports image weight (--iw) and chaos (--c) parameters
 * - Stores the style transferred image as a urlData
 * 
 * Uses Firebase Storage for image hosting to enable Midjourney style transfer.
 * Firebase provides public URLs that are accessible by PiAPI/Midjourney servers.
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

        // Content prompt (for OpenAI)
        {
            const slot = this.newSlot("contentPrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Content Prompt");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }

        // Style prompt (for Midjourney style reference)
        {
            const slot = this.newSlot("stylePrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Style Prompt");
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

        // Initial image reference for Firebase upload
        {
            const slot = this.newSlot("initRefImage", null);
            slot.setFinalInitProto(FirestoreImage);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // PiAPI prompt for final style transfer
        {
            const slot = this.newSlot("piApiFinalPrompt", null);
            slot.setFinalInitProto(PiApiImagePrompt);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // Image weight (0-2, default 1) - How closely to follow input image
        {
            const slot = this.newSlot("imageWeight", null);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidItems([
                { value: 0,    label: "None (0) - Ignore input" },
                { value: 0.25, label: "Very Low (0.25)" },
                { value: 0.5,  label: "Low (0.5)" },
                { value: 0.75, label: "Medium-Low (0.75)" },
                { value: 1,    label: "Default (1)" },
                { value: 1.25, label: "Medium-High (1.25)" },
                { value: 1.5,  label: "High (1.5)" },
                { value: 1.75, label: "Very High (1.75)" },
                { value: 2,    label: "Maximum (2) - Exact composition" }
            ]);
            slot.setInitValue(1); // Default to Midjourney's default
        }


        // Chaos weight (0-100, default 0) - Controls variation/randomness
        {
            const slot = this.newSlot("chaosWeight", null);
            slot.setSlotType("Number");
            slot.setLabel("Chaos Weight");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidItems([
                { value: 0,   label: "None (0) - Most consistent" },
                { value: 10,  label: "Very Low (10)" },
                { value: 20,  label: "Low (20)" },
                { value: 30,  label: "Medium-Low (30)" },
                { value: 40,  label: "Medium (40)" },
                { value: 50,  label: "Default (50)" },
                { value: 60,  label: "Medium-High (60)" },
                { value: 70,  label: "High (70)" },
                { value: 80,  label: "Very High (80)" },
                { value: 90,  label: "Extremely High (90)" },
                { value: 100, label: "Maximum (100) - Most varied" }
            ]);
            slot.setInitValue(0); // Default to most consistent
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
            const validValues = ["16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "1:1"];
            const slot = this.newSlot("aspectRatio", validValues.first());
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidValues(validValues);
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
            slot.setLabel("Start Full Process");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("start");
        }
        
        // Just style transfer action (skip OpenAI generation)
        {
            const slot = this.newSlot("justStyleTransferAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Just Style Transfer");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("justStyleTransfer");
        }
        
        // Retry final transfer action
        {
            const slot = this.newSlot("retryFinalTransferAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Retry Final Transfer");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("retryFinalTransfer");
        }


        // Delegate
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setTitle("Style Transfer");
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
        if (this.openAiPrompt()) {
            this.openAiPrompt().setTitle("OpenAI Content Image");
        }
        if (this.initRefImage()) {
            this.initRefImage().setTitle("OpenAI Image (Firebase)");
        }
        if (this.piApiFinalPrompt()) {
            this.piApiFinalPrompt().setTitle("Midjourney Style Transfer");
        }
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
     * @description Sets the prompt - handles backwards compatibility
     * @param {string} prompt - The prompt to set
     * @returns {this} The current instance
     * @category Setup
     */
    setPrompt (prompt) {
        // Try to parse json prompts
        const jsonMatch = prompt.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch.isValidJson()) {
            const jsonObj = JSON.parse(jsonMatch[0]);
            
            if (jsonObj.scene) {
                this.setContentPrompt(jsonObj.scene);
            }
            
            if (jsonObj.artStyle) {
                let style = jsonObj.artStyle;
                this.setStylePrompt(style);
            }                
        } else {
            debugger;
            // If it's not JSON or parsing failed, use the prompt as both content and style
            this.setContentPrompt(prompt);
            this.setStylePrompt("fantasy art illustration");
        }
        return this;
    }

    /**
     * @description Sets up the initial OpenAI prompt.
     * @returns {Object} The configured OpenAI prompt.
     * @category Setup
     */
    setupInitialPrompt () {
        const openAiPrompt = this.openAiPrompt();
        openAiPrompt.setPrompt(this.contentPrompt());
        openAiPrompt.setTtiModel("gpt-image-1");
        openAiPrompt.setQuality("standard");
        openAiPrompt.setImageCount(1);
        return openAiPrompt;
    }


    /**
     * @description Gets the Firebase Storage URL for the OpenAI image.
     * @returns {string} The Firebase URL or null if not uploaded.
     * @category Helper
     */
    getInitImageFirebaseUrl () {
        const initRef = this.initRefImage();
        if (initRef && initRef.hasPublicUrl()) {
            return initRef.publicUrl();
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
            
            // Check if PiAPI service has API key
            if (!this.piApiService().hasApiKey()) {
                throw new Error("PiAPI API key is not configured. Please set your API key in PiAPI Service settings.");
            }
            
            // Check if OpenAI service has API key
            if (!this.openAiService().hasApiKey()) {
                throw new Error("OpenAI API key is not configured. Please set your API key in OpenAI Service settings.");
            }
            
            // Check if Firebase service is configured
            const firebaseService = FirebaseStorageService.shared();
            if (!firebaseService.isConfigured()) {
                throw new Error("Firebase Storage is not configured. Please set up Firebase configuration in Firebase Storage Service settings.");
            }
            
            // Validate inputs
            if (!this.contentPrompt() || this.contentPrompt().trim() === "") {
                throw new Error("Content prompt is required");
            }
            
            if (!this.stylePrompt() || this.stylePrompt().trim() === "") {
                throw new Error("Style prompt is required");
            }
            
            // Check what's already completed
            const openAiPrompt = this.openAiPrompt();
            const hasOpenAiImage = openAiPrompt && openAiPrompt.images() && openAiPrompt.images().subnodeCount() > 0;
            const hasOpenAiFirebase = this.getInitImageFirebaseUrl() !== null;
            
            // Step 1: Generate OpenAI image if needed
            if (!hasOpenAiImage) {
                this.setStatus("generating content image with OpenAI...");
                this.sendDelegate("onImagePromptLoading");
                
                const openAiPrompt = this.setupInitialPrompt();
                openAiPrompt.setDelegate(this);
                
                console.log("=== STEP 1: OpenAI Image Generation ===");
                console.log("Content Prompt:", this.contentPrompt());
                console.log("Sending to OpenAI API...");
                
                await openAiPrompt.generate();
            } else {
                this.setStatus("using existing OpenAI image...");
                console.log("=== STEP 1: Using existing OpenAI image ===");
            }
            
            // Step 2: Verify OpenAI generation succeeded
            if (!openAiPrompt.images() || openAiPrompt.images().subnodeCount() === 0) {
                const openAiError = openAiPrompt.error ? openAiPrompt.error() : "No images generated";
                throw new Error("Failed to generate OpenAI image: " + openAiError);
            }
            
            const openAiImage = openAiPrompt.images().subnodes().last();
            const openAiImageDataUrl = openAiImage.imageUrl();
            
            if (!openAiImageDataUrl) {
                throw new Error("Failed to get image URL from OpenAI");
            }
            
            // Step 3: Upload OpenAI image to Firebase if needed
            if (!hasOpenAiFirebase) {
                this.setStatus("uploading OpenAI image to Firebase...");
                console.log("=== STEP 3: Uploading to Firebase ===");
                const initRef = this.initRefImage();
                initRef.setDataUrl(openAiImageDataUrl);
                initRef.setImageLabel("OpenAI content image");
                await initRef.uploadToFirebase();
            } else {
                this.setStatus("using existing Firebase upload...");
                console.log("=== STEP 3: Using existing Firebase upload ===");
            }
            
            // Verify upload succeeded
            const initRef = this.initRefImage();
            
            if (!initRef || !initRef.hasPublicUrl()) {
                throw new Error("Failed to upload OpenAI image to Firebase");
            }
            
            const openAiFirebaseUrl = this.getInitImageFirebaseUrl();
            
            if (!openAiFirebaseUrl) {
                throw new Error("Failed to get Firebase URL for OpenAI image");
            }
            
            console.log("Firebase URL for OpenAI image:", openAiFirebaseUrl);
            
            // Step 4: Apply style transfer using Firebase URL
            this.setStatus("applying style to OpenAI image with Midjourney...");
            
            const finalPrompt = this.piApiFinalPrompt();
            
            // Build the simple prompt: {image url} in the style of {style}
            // IMPORTANT: Do NOT include content description - only the image URL and style
            // The OpenAI image already contains the content, we just want to apply style
            let fullPrompt = openAiFirebaseUrl; // Image URL must be first
            fullPrompt += ` in the style of ${this.stylePrompt()}`; // ONLY add the style, not content
            
            // Add image weight if not default
            if (this.imageWeight() !== 1) {
                fullPrompt += ` --iw ${this.imageWeight()}`;
            }
            
            // Add chaos weight if not default
            if (this.chaosWeight() && this.chaosWeight() !== 0) {
                fullPrompt += ` --c ${this.chaosWeight()}`;
            }
            
            // Note: --sw (style weight) only works with --sref (style reference images)
            // --iw (image weight) controls how closely to follow the input image
            // --c (chaos) controls variation between the 4 generated images
            
            console.log("=== STEP 4: Midjourney Style Transfer ===");
            console.log("Content Prompt (used for OpenAI):", this.contentPrompt());
            console.log("Style Prompt (for Midjourney):", this.stylePrompt());
            console.log("Full Midjourney Prompt:", fullPrompt);
            console.log("Aspect Ratio:", this.aspectRatio());
            console.log("Process Mode:", this.processMode());
            console.log("Sending to PiAPI/Midjourney...");
            
            finalPrompt.setPrompt(fullPrompt);
            finalPrompt.setModel("midjourney");
            finalPrompt.setAspectRatio(this.aspectRatio());
            finalPrompt.setProcessMode(this.processMode());
            finalPrompt.setDelegate(this);
            
            // Start final generation and wait for completion
            await finalPrompt.generate();
            await this.waitForMidjourneyCompletion(finalPrompt);
            
            // Get the first image from the final generation
            const images = finalPrompt.images();
            if (images && images.subnodeCount() > 0) {
                console.log("=== STEP 5: Style Transfer Complete ===");
                console.log("Number of images generated:", images.subnodeCount());
                const firstImage = images.subnodes().first(); // Use first image instead of last
                if (firstImage && firstImage.imageUrl()) {
                    console.log("Using first image from generation");
                    // Don't log the full data URL, just confirm we have it
                    console.log("Result image received successfully");
                    this.setResultDataUrl(firstImage.imageUrl());
                    this.setStatus("style transfer complete");
                    this.sendDelegate("onImagePromptImageLoaded", [this, firstImage]);
                    this.sendDelegate("onImagePromptEnd", [this]);
                } else {
                    throw new Error("Failed to get final image URL from Midjourney");
                }
            } else {
                throw new Error("No images generated in final style transfer");
            }
            
        } catch (error) {
            this.setError(error.message);
            this.setStatus("failed");
            this.sendDelegate("onImagePromptError");
        }
    }
    
    /**
     * @description Just does the style transfer without regenerating the OpenAI image.
     * @returns {Promise<void>}
     * @category Actions
     */
    async justStyleTransfer () {
        try {
            this.setError("");
            this.setStatus("starting style transfer only...");
            
            // Check if we have an OpenAI image
            const openAiPrompt = this.openAiPrompt();
            if (!openAiPrompt || !openAiPrompt.images() || openAiPrompt.images().subnodeCount() === 0) {
                throw new Error("No OpenAI image available. Generate one first using 'Start Full Process'");
            }
            
            // Check if Firebase Storage is configured
            const firebaseService = FirebaseStorageService.shared();
            if (!firebaseService.isConfigured()) {
                throw new Error("Firebase Storage is not configured");
            }
            
            // Validate inputs
            if (!this.stylePrompt() || this.stylePrompt().trim() === "") {
                throw new Error("Style prompt is required");
            }
            
            console.log("=== JUST STYLE TRANSFER ===");
            console.log("Using existing OpenAI image");
            console.log("Style Prompt:", this.stylePrompt());
            console.log("Image Weight:", this.imageWeight());
            
            // Get the OpenAI image
            const openAiImage = openAiPrompt.images().subnodes().last();
            const openAiImageDataUrl = openAiImage.imageUrl();
            
            if (!openAiImageDataUrl) {
                throw new Error("Failed to get image URL from OpenAI");
            }
            
            // Upload to Firebase if needed
            const hasOpenAiFirebase = this.getInitImageFirebaseUrl() !== null;
            if (!hasOpenAiFirebase) {
                this.setStatus("uploading OpenAI image to Firebase...");
                console.log("Uploading to Firebase...");
                const initRef = this.initRefImage();
                initRef.setDataUrl(openAiImageDataUrl);
                initRef.setImageLabel("OpenAI content image");
                await initRef.uploadToFirebase();
            }
            
            const openAiFirebaseUrl = this.getInitImageFirebaseUrl();
            if (!openAiFirebaseUrl) {
                throw new Error("Failed to get Firebase URL for OpenAI image");
            }
            
            console.log("Firebase URL:", openAiFirebaseUrl);
            
            // Apply style transfer
            this.setStatus("applying style to OpenAI image with Midjourney...");
            
            const finalPrompt = this.piApiFinalPrompt();
            
            // Build the simple prompt: {image url} in the style of {style}
            // IMPORTANT: Do NOT include content description - only the image URL and style
            // The OpenAI image already contains the content, we just want to apply style
            let fullPrompt = openAiFirebaseUrl; // Image URL must be first
            fullPrompt += ` in the style of ${this.stylePrompt()}`; // ONLY add the style, not content
            
            // Add image weight if not default
            if (this.imageWeight() !== 1) {
                fullPrompt += ` --iw ${this.imageWeight()}`;
            }
            
            console.log("Full Midjourney Prompt:", fullPrompt);
            console.log("Sending to PiAPI/Midjourney...");
            
            finalPrompt.setPrompt(fullPrompt);
            finalPrompt.setModel("midjourney");
            finalPrompt.setAspectRatio(this.aspectRatio());
            finalPrompt.setProcessMode(this.processMode());
            finalPrompt.setDelegate(this);
            
            // Start final generation and wait for completion
            await finalPrompt.generate();
            await this.waitForMidjourneyCompletion(finalPrompt);
            
            // Get the first image from the final generation
            const images = finalPrompt.images();
            if (images && images.subnodeCount() > 0) {
                console.log("=== Style Transfer Complete ===");
                console.log("Number of images generated:", images.subnodeCount());
                const firstImage = images.subnodes().first();
                if (firstImage && firstImage.imageUrl()) {
                    console.log("Using first image from generation");
                    this.setResultDataUrl(firstImage.imageUrl());
                    this.setStatus("style transfer complete");
                    this.sendDelegate("onImagePromptImageLoaded", [this, firstImage]);
                    this.sendDelegate("onImagePromptEnd", [this]);
                } else {
                    throw new Error("Failed to get final image URL from Midjourney");
                }
            } else {
                throw new Error("No images generated in style transfer");
            }
            
        } catch (error) {
            this.setError(error.message);
            this.setStatus("failed");
            this.sendDelegate("onImagePromptError");
        }
    }
    
    /**
     * @description Retries just the final style transfer step.
     * @returns {Promise<void>}
     * @category Actions
     */
    async retryFinalTransfer () {
        try {
            this.setError("");
            this.setStatus("retrying style transfer...");
            
            // Check we have the OpenAI Firebase URL
            const openAiFirebaseUrl = this.getInitImageFirebaseUrl();
            
            if (!openAiFirebaseUrl) {
                throw new Error("OpenAI image not uploaded to Firebase yet");
            }
            
            // Check if Firebase URL is still accessible
            this.setStatus("checking Firebase image accessibility...");
            
            try {
                const response = await fetch(openAiFirebaseUrl, { method: 'HEAD' });
                if (!response.ok) {
                    console.error(`OpenAI Firebase URL check failed:`, response.status, response.statusText);
                    if (response.status === 403) {
                        throw new Error(`OpenAI Firebase URL has expired or is not accessible (403 Forbidden). Need to re-upload.`);
                    } else if (response.status === 404) {
                        throw new Error(`OpenAI Firebase image not found (404). Need to re-upload.`);
                    } else {
                        throw new Error(`OpenAI Firebase URL is not accessible: ${response.status} ${response.statusText}`);
                    }
                }
                console.log(`OpenAI Firebase URL is accessible`);
            } catch (error) {
                // If Firebase URL is not accessible, we need to re-upload
                this.setStatus("Firebase URL expired, need to re-generate or re-upload image");
                throw error;
            }
            
            // Apply style transfer
            this.setStatus("applying style to OpenAI image with Midjourney...");
            
            const finalPrompt = this.piApiFinalPrompt();
            
            // Build the simple prompt: {image url} in the style of {style}
            // IMPORTANT: Do NOT include content description - only the image URL and style
            // The OpenAI image already contains the content, we just want to apply style
            let fullPrompt = openAiFirebaseUrl; // Image URL must be first
            fullPrompt += ` in the style of ${this.stylePrompt()}`; // ONLY add the style, not content
            
            // Add image weight if not default
            if (this.imageWeight() !== 1) {
                fullPrompt += ` --iw ${this.imageWeight()}`;
            }
            
            // Add chaos weight if not default
            if (this.chaosWeight() && this.chaosWeight() !== 0) {
                fullPrompt += ` --c ${this.chaosWeight()}`;
            }
            
            // Note: --sw (style weight) only works with --sref (style reference images)
            // --iw (image weight) controls how closely to follow the input image
            // --c (chaos) controls variation between the 4 generated images
            
            console.log("Final style transfer prompt (image + style only):", fullPrompt);
            
            finalPrompt.setPrompt(fullPrompt);
            finalPrompt.setModel("midjourney");
            finalPrompt.setAspectRatio(this.aspectRatio());
            finalPrompt.setProcessMode(this.processMode());
            finalPrompt.setDelegate(this);
            
            // Start final generation and wait for completion
            await finalPrompt.generate();
            await this.waitForMidjourneyCompletion(finalPrompt);
            
            // Get the first image from the final generation
            const images = finalPrompt.images();
            if (images && images.subnodeCount() > 0) {
                console.log("=== STEP 5: Style Transfer Complete ===");
                console.log("Number of images generated:", images.subnodeCount());
                const firstImage = images.subnodes().first(); // Use first image instead of last
                if (firstImage && firstImage.imageUrl()) {
                    console.log("Using first image from generation");
                    // Don't log the full data URL, just confirm we have it
                    console.log("Result image received successfully");
                    this.setResultDataUrl(firstImage.imageUrl());
                    this.setStatus("style transfer complete");
                    this.sendDelegate("onImagePromptImageLoaded", [this, firstImage]);
                    this.sendDelegate("onImagePromptEnd", [this]);
                } else {
                    throw new Error("Failed to get final image URL from Midjourney");
                }
            } else {
                throw new Error("No images generated in final style transfer");
            }
            
        } catch (error) {
            this.setError(error.message);
            this.setStatus("retry failed");
            this.sendDelegate("onImagePromptError");
        }
    }
    
    /**
     * @description Gets action info for the retry final transfer action.
     * @returns {Object} Action info.
     * @category Actions
     */
    retryFinalTransferActionInfo () {
        const hasOpenAiFirebase = this.getInitImageFirebaseUrl() !== null;
        const hasStylePrompt = this.stylePrompt() && this.stylePrompt().trim() !== "";
        
        return {
            isEnabled: hasOpenAiFirebase && hasStylePrompt && !this.isProcessing(),
            isVisible: hasOpenAiFirebase
        };
    }
    
    
    /**
     * @description Waits for a Midjourney generation to complete.
     * @param {Object} piApiPrompt - The PiAPI prompt to wait for.
     * @returns {Promise<void>}
     * @category Helper
     */
    async waitForMidjourneyCompletion (piApiPrompt) {
        return new Promise((resolve, reject) => {
            let pollCount = 0;
            const maxPolls = 60; // 5 minutes with 5-second intervals
            
            const checkInterval = setInterval(() => {
                pollCount++;
                
                // Check if images have been loaded (this happens after polling completes)
                const images = piApiPrompt.images();
                if (images && images.subnodeCount() > 0) {
                    // Images are ready
                    clearInterval(checkInterval);
                    resolve();
                    return;
                }
                
                // Check generation status
                const generations = piApiPrompt.generations();
                if (generations && generations.subnodes().length > 0) {
                    const generation = generations.subnodes().first();
                    const status = generation.status();
                    
                    console.log(`Midjourney polling ${pollCount}/${maxPolls}: ${status}`);
                    
                    if (status.includes("error") || status.includes("failed")) {
                        clearInterval(checkInterval);
                        // Get more details about the error
                        let errorDetails = generation.error ? generation.error() : "";
                        
                        // Try to get the full API response for more details
                        if (generation.xhrRequest && generation.xhrRequest()) {
                            try {
                                const responseText = generation.xhrRequest().responseText();
                                const responseJson = JSON.parse(responseText);
                                
                                // Extract error details from the response
                                if (responseJson.data && responseJson.data.error) {
                                    const apiError = responseJson.data.error;
                                    errorDetails = `${apiError.message || apiError.raw_message || errorDetails}`;
                                    if (apiError.detail) {
                                        errorDetails += ` - ${apiError.detail}`;
                                    }
                                }
                                
                                // Create a single object with all debug info
                                const debugInfo = {
                                    status: status,
                                    errorDetails: errorDetails,
                                    failedPrompt: responseJson.data?.input?.prompt || "unknown",
                                    apiError: responseJson.data?.error || null,
                                    fullResponse: responseJson
                                };
                                
                                // Log as a single string for easy copying
                                console.error("MIDJOURNEY_ERROR_DEBUG: " + JSON.stringify(debugInfo, null, 2));
                            } catch (e) {
                                console.error("PARSE_ERROR: " + e.message);
                            }
                        }
                        
                        const errorMessage = errorDetails || "Unknown error - check console for details";
                        reject(new Error(`Midjourney generation failed: ${errorMessage}`));
                    } else if (pollCount >= maxPolls) {
                        clearInterval(checkInterval);
                        reject(new Error("Midjourney generation timed out after 5 minutes"));
                    }
                    // Otherwise continue polling - "completed" status will result in images being created
                } else if (pollCount >= maxPolls) {
                    clearInterval(checkInterval);
                    reject(new Error("Midjourney generation timed out - no generation found"));
                }
            }, 5000); // Check every 5 seconds
        });
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

    // Delegate methods from prompts
    onImagePromptSuccess (/*prompt*/) {
        // We handle final results directly after await
        // This is just for status updates during generation
    }

    onImagePromptImageLoaded (prompt /*, aiImage*/) {
        // Called when an individual image loads
        if (prompt === this.openAiPrompt()) {
            // OpenAI image loaded - will be used as base
            this.setStatus("OpenAI image ready");
        }
        // Don't handle piApiFinalPrompt here - we handle it after await
    }

    onImagePromptImageError (prompt, aiImage) {
        // Called if an image fails to load
        this.setError("Image loading failed: " + aiImage.error());
        this.setStatus("failed");
        this.sendDelegate("onImagePromptImageError", [this, aiImage]);
    }

    onImagePromptEnd (prompt) {
        // Called when the prompt process ends
        if (prompt === this.piApiFinalPrompt()) {
            this.sendDelegate("onImagePromptEnd", [this]);
        }
        // Don't forward end events from intermediate prompts
    }

    /**
     * @description Checks if the style transfer is currently processing.
     * @returns {boolean} True if processing, false otherwise.
     * @category Status
     */
    isProcessing () {
        const status = this.status();
        return status !== "" && 
               status !== "failed" && 
               status !== "style transfer complete" &&
               status !== "completed" &&
               status !== "Using Midjourney artistic interpretation as final result" &&
               !status.includes("Error");
    }
    
    /**
     * @description Checks if the style transfer process can be started.
     * @returns {boolean} True if can start, false otherwise.
     * @category Status
     */
    canStart () {
        return this.contentPrompt() !== null && 
               this.contentPrompt().trim() !== "" && 
               this.stylePrompt() !== null &&
               this.stylePrompt().trim() !== "" &&
               !this.isProcessing();
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
        // Note: stylePrompt is a string, not an object with shutdown
        if (this.piApiFinalPrompt()) {
            this.piApiFinalPrompt().shutdown();
        }
        return this;
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
     * @description Gets action info for the just style transfer action.
     * @returns {Object} Action info.
     * @category Actions
     */
    justStyleTransferActionInfo () {
        const openAiPrompt = this.openAiPrompt();
        const hasOpenAiImage = openAiPrompt && openAiPrompt.images() && openAiPrompt.images().subnodeCount() > 0;
        const hasStylePrompt = this.stylePrompt() && this.stylePrompt().trim() !== "";
        
        return {
            isEnabled: hasOpenAiImage && hasStylePrompt && !this.isProcessing(),
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
        
        // Check for missing API keys
        if (!this.piApiService().hasApiKey()) {
            return "PiAPI key required";
        }
        if (!this.openAiService().hasApiKey()) {
            return "OpenAI key required";
        }
        if (!FirebaseStorageService.shared().isConfigured()) {
            return "Firebase Storage configuration required";
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