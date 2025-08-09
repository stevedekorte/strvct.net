"use strict";

/**
 * @module library.services.PiAPI.StyleTransfers
 */

/**
 * @class PiApiMidJourneyStyleTransfer
 * @extends SvSummaryNode
 * @classdesc How it works:
 * - Takes a text prompt
 * - Generates two images in parallel:
 *   1. OpenAI image (literal interpretation)
 *   2. Midjourney image (artistic interpretation)
 * - Uses the Midjourney image as a style reference
 * - Applies that style to the OpenAI image using Midjourney's --sref parameter
 * - Stores the style transferred image as a urlData
 * 
 * Uses Firebase Storage for image hosting to enable Midjourney style transfer.
 * Firebase provides public URLs that are accessible by PiAPI/Midjourney servers,
 * solving the Leonardo S3 access restriction issue.
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

        // Initial image reference for Firebase upload
        {
            const slot = this.newSlot("initRefImage", null);
            slot.setFinalInitProto(FirebaseStorageImage);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // First PiAPI prompt for generating Midjourney style image
        {
            const slot = this.newSlot("piApiStylePrompt", null);
            slot.setFinalInitProto(PiApiImagePrompt);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // Style reference image from Midjourney (for Firebase upload)
        {
            const slot = this.newSlot("styleRefImage", null);
            slot.setFinalInitProto(FirebaseStorageImage);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // Second PiAPI prompt for final style transfer
        {
            const slot = this.newSlot("piApiFinalPrompt", null);
            slot.setFinalInitProto(PiApiImagePrompt);
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
            this.openAiPrompt().setTitle("OpenAI Literal Interpretation");
        }
        if (this.initRefImage()) {
            this.initRefImage().setTitle("OpenAI Image (Firebase)");
        }
        if (this.piApiStylePrompt()) {
            this.piApiStylePrompt().setTitle("Midjourney Artistic Interpretation");
        }
        if (this.styleRefImage()) {
            this.styleRefImage().setTitle("Midjourney Style (Firebase)");
        }
        if (this.piApiFinalPrompt()) {
            this.piApiFinalPrompt().setTitle("Final Style Transfer");
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
     * @description Converts a JSON-structured prompt to natural language.
     * @param {string} prompt - The original prompt (may contain JSON)
     * @returns {string} A natural language prompt suitable for Midjourney
     * @category Helper
     */
    promptToNaturalLanguage (prompt) {
        // Check if the prompt contains JSON
        if (prompt.includes("Create an image with the attributes described by this JSON")) {
            try {
                // Extract the JSON part
                const jsonMatch = prompt.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonStr = jsonMatch[0];
                    const jsonObj = JSON.parse(jsonStr);
                    
                    // Build a natural language prompt from the JSON
                    let naturalPrompt = "";
                    
                    // Add the scene description
                    if (jsonObj.scene) {
                        naturalPrompt += jsonObj.scene;
                    }
                    
                    // Add the art style
                    if (jsonObj.artStyle) {
                        // Clean up the art style description
                        let style = jsonObj.artStyle;
                        style = style.replace(/^Inspired by the /, "in the style of ");
                        style = style.replace(/\.$/, ""); // Remove trailing period
                        naturalPrompt += " " + style;
                    }
                    
                    return naturalPrompt.trim();
                }
            } catch (e) {
                console.warn("Failed to parse JSON from prompt, using original:", e);
            }
        }
        
        // Return original prompt if it's not JSON-structured
        return prompt;
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
     * @description Gets the Firebase Storage URL for the style reference image.
     * @returns {string} The Firebase URL or null if not uploaded.
     * @category Helper
     */
    getStyleImageFirebaseUrl () {
        const styleRef = this.styleRefImage();
        if (styleRef && styleRef.hasPublicUrl()) {
            return styleRef.publicUrl();
        }
        return null;
    }

    /**
     * @description Gets the Firebase Storage URL for the initial image.
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
            if (!this.prompt() || this.prompt().trim() === "") {
                throw new Error("Prompt is required");
            }
            
            // Check what's already completed
            const openAiPrompt = this.openAiPrompt();
            const stylePrompt = this.piApiStylePrompt();
            const hasOpenAiImage = openAiPrompt && openAiPrompt.images() && openAiPrompt.images().subnodeCount() > 0;
            const hasMjStyleImage = stylePrompt && stylePrompt.images() && stylePrompt.images().subnodeCount() > 0;
            const hasOpenAiFirebase = this.getInitImageFirebaseUrl() !== null;
            const hasMjStyleFirebase = this.getStyleImageFirebaseUrl() !== null;
            
            // Step 1: Generate images if needed
            if (!hasOpenAiImage || !hasMjStyleImage) {
                this.setStatus("generating missing images...");
                this.sendDelegate("onImagePromptLoading");
                
                const promises = [];
                
                // Generate OpenAI image if needed
                if (!hasOpenAiImage) {
                    const openAiPrompt = this.setupInitialPrompt();
                    openAiPrompt.setDelegate(this);
                    promises.push(openAiPrompt.generate());
                }
                
                // Generate Midjourney style image if needed
                if (!hasMjStyleImage) {
                    const stylePrompt = this.piApiStylePrompt();
                    // Convert JSON-structured prompt to natural language for Midjourney
                    const naturalPrompt = this.promptToNaturalLanguage(this.prompt());
                    stylePrompt.setPrompt(naturalPrompt);
                    stylePrompt.setModel("midjourney");
                    stylePrompt.setAspectRatio(this.aspectRatio());
                    stylePrompt.setProcessMode(this.processMode());
                    stylePrompt.setDelegate(this);
                    promises.push(stylePrompt.generate().then(() => this.waitForMidjourneyCompletion(stylePrompt)));
                }
                
                if (promises.length > 0) {
                    this.setStatus("waiting for image generation to complete...");
                    await Promise.all(promises);
                }
            } else {
                this.setStatus("using existing generated images...");
            }
            
            // Step 2: Verify both generations succeeded
            if (!openAiPrompt.images() || openAiPrompt.images().subnodeCount() === 0) {
                const openAiError = openAiPrompt.error ? openAiPrompt.error() : "No images generated";
                throw new Error("Failed to generate OpenAI image: " + openAiError);
            }
            
            if (!stylePrompt.images() || stylePrompt.images().subnodeCount() === 0) {
                // Log more details about what went wrong
                const mjError = stylePrompt.error ? stylePrompt.error() : "No images generated";
                const generations = stylePrompt.generations();
                let genStatus = "No generations";
                if (generations && generations.subnodes().length > 0) {
                    const gen = generations.subnodes().first();
                    genStatus = `Generation status: ${gen.status()}, error: ${gen.error()}`;
                }
                console.error("Midjourney style generation failed:", mjError, genStatus);
                throw new Error(`Failed to generate Midjourney style image: ${mjError}. ${genStatus}`);
            }
            
            const openAiImage = openAiPrompt.images().subnodes().last();
            const openAiImageDataUrl = openAiImage.imageUrl();
            
            const mjStyleImage = stylePrompt.images().subnodes().last();
            const mjStyleImageUrl = mjStyleImage.imageUrl();
            
            if (!openAiImageDataUrl) {
                throw new Error("Failed to get image URL from OpenAI");
            }
            
            if (!mjStyleImageUrl) {
                throw new Error("Failed to get image URL from Midjourney");
            }
            
            // Step 3: Upload both images to Firebase if needed
            const uploadPromises = [];
            
            if (!hasOpenAiFirebase) {
                this.setStatus("uploading OpenAI image to Firebase...");
                const initRef = this.initRefImage();
                initRef.setDataUrl(openAiImageDataUrl);
                initRef.setImageLabel("OpenAI literal interpretation");
                uploadPromises.push(initRef.uploadToFirebase());
            }
            
            if (!hasMjStyleFirebase) {
                this.setStatus("uploading Midjourney style image to Firebase...");
                const styleRef = this.styleRefImage();
                styleRef.setDataUrl(mjStyleImageUrl);
                styleRef.setImageLabel("Midjourney artistic interpretation");
                uploadPromises.push(styleRef.uploadToFirebase());
            }
            
            if (uploadPromises.length > 0) {
                await Promise.all(uploadPromises);
            } else {
                this.setStatus("using existing Firebase uploads...");
            }
            
            // Verify uploads succeeded
            const initRef = this.initRefImage();
            const styleRef = this.styleRefImage();
            
            if (!initRef || !initRef.hasPublicUrl()) {
                throw new Error("Failed to upload OpenAI image to Firebase");
            }
            
            if (!styleRef || !styleRef.hasPublicUrl()) {
                throw new Error("Failed to upload Midjourney style image to Firebase");
            }
            
            const openAiFirebaseUrl = this.getInitImageFirebaseUrl();
            const mjStyleFirebaseUrl = this.getStyleImageFirebaseUrl();
            
            if (!openAiFirebaseUrl) {
                throw new Error("Failed to get Firebase URL for OpenAI image");
            }
            
            if (!mjStyleFirebaseUrl) {
                throw new Error("Failed to get Firebase URL for Midjourney style image");
            }
            
            // Step 4: Apply style transfer using Firebase URLs
            this.setStatus("applying Midjourney artistic style to OpenAI content...");
            
            const finalPrompt = this.piApiFinalPrompt();
            
            // Build the final prompt with both images
            // Image URLs must be at the front of the prompt per Midjourney requirements
            // Convert JSON-structured prompt to natural language for Midjourney
            const naturalPrompt = this.promptToNaturalLanguage(this.prompt());
            let fullPrompt = openAiFirebaseUrl; // Image URL must be first
            fullPrompt += ` ${naturalPrompt}`; // Then add the natural language prompt
            fullPrompt += ` --sref ${mjStyleFirebaseUrl}`; // Add Midjourney as style reference
            
            if (this.styleWeight() !== 100) {
                fullPrompt += ` --sw ${this.styleWeight()}`;
            }
            
            console.log("Final style transfer prompt with Firebase URLs:", fullPrompt);
            
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
                const firstImage = images.subnodes().first(); // Use first image instead of last
                if (firstImage && firstImage.imageUrl()) {
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
     * @description Retries just the final style transfer step.
     * @returns {Promise<void>}
     * @category Actions
     */
    async retryFinalTransfer () {
        try {
            this.setError("");
            this.setStatus("retrying final style transfer...");
            
            // Check we have both Firebase URLs
            const openAiFirebaseUrl = this.getInitImageFirebaseUrl();
            const mjStyleFirebaseUrl = this.getStyleImageFirebaseUrl();
            
            if (!openAiFirebaseUrl) {
                throw new Error("OpenAI image not uploaded to Firebase yet");
            }
            
            if (!mjStyleFirebaseUrl) {
                throw new Error("Midjourney style image not uploaded to Firebase yet");
            }
            
            // Check if Firebase URLs are still accessible
            this.setStatus("checking Firebase image accessibility...");
            
            try {
                const checkUrl = async (url, name) => {
                    const response = await fetch(url, { method: 'HEAD' });
                    if (!response.ok) {
                        console.error(`${name} Firebase URL check failed:`, response.status, response.statusText);
                        if (response.status === 403) {
                            throw new Error(`${name} Firebase URL has expired or is not accessible (403 Forbidden). Need to re-upload.`);
                        } else if (response.status === 404) {
                            throw new Error(`${name} Firebase image not found (404). Need to re-upload.`);
                        } else {
                            throw new Error(`${name} Firebase URL is not accessible: ${response.status} ${response.statusText}`);
                        }
                    }
                    console.log(`${name} Firebase URL is accessible`);
                };
                
                await Promise.all([
                    checkUrl(openAiFirebaseUrl, "OpenAI"),
                    checkUrl(mjStyleFirebaseUrl, "Midjourney style")
                ]);
            } catch (error) {
                // If Firebase URLs are not accessible, we need to re-upload
                this.setStatus("Firebase URLs expired, need to re-generate or re-upload images");
                throw error;
            }
            
            // Apply style transfer
            this.setStatus("applying Midjourney style to OpenAI image...");
            
            const finalPrompt = this.piApiFinalPrompt();
            
            // Build the final prompt with both images accessible from Firebase
            // Image URLs must be at the front of the prompt per Midjourney requirements
            // Convert JSON-structured prompt to natural language for Midjourney
            const naturalPrompt = this.promptToNaturalLanguage(this.prompt());
            let fullPrompt = openAiFirebaseUrl; // Image URL must be first
            fullPrompt += ` ${naturalPrompt}`; // Then add the natural language prompt
            fullPrompt += ` --sref ${mjStyleFirebaseUrl}`; // Add Midjourney as style reference
            
            if (this.styleWeight() !== 100) {
                fullPrompt += ` --sw ${this.styleWeight()}`;
            }
            
            console.log("Final style transfer prompt with Firebase URLs:", fullPrompt);
            
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
                const firstImage = images.subnodes().first(); // Use first image instead of last
                if (firstImage && firstImage.imageUrl()) {
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
        const hasMjStyleFirebase = this.getStyleImageFirebaseUrl() !== null;
        
        return {
            isEnabled: hasOpenAiFirebase && hasMjStyleFirebase && !this.isProcessing(),
            isVisible: hasOpenAiFirebase && hasMjStyleFirebase
        };
    }
    
    /**
     * @description Re-uploads images to Firebase if they've expired.
     * @returns {Promise<void>}
     * @category Helper
     */
    async reuploadImagesToFirebase () {
        this.setStatus("re-uploading images to Firebase...");
        
        const openAiPrompt = this.openAiPrompt();
        const stylePrompt = this.piApiStylePrompt();
        
        // Get the image data URLs
        let openAiImageDataUrl = null;
        let mjStyleImageUrl = null;
        
        if (openAiPrompt && openAiPrompt.images() && openAiPrompt.images().subnodeCount() > 0) {
            const openAiImage = openAiPrompt.images().subnodes().last();
            openAiImageDataUrl = openAiImage.imageUrl();
        }
        
        if (stylePrompt && stylePrompt.images() && stylePrompt.images().subnodeCount() > 0) {
            const mjStyleImage = stylePrompt.images().subnodes().last();
            mjStyleImageUrl = mjStyleImage.imageUrl();
        }
        
        if (!openAiImageDataUrl || !mjStyleImageUrl) {
            throw new Error("Cannot re-upload - original images not found. Need to regenerate.");
        }
        
        // Re-upload both images
        const uploadPromises = [];
        
        const initRef = this.initRefImage();
        initRef.setDataUrl(openAiImageDataUrl);
        initRef.setImageLabel("OpenAI literal interpretation (re-uploaded)");
        // Clear the old URL to force a new upload
        initRef.setPublicUrl(null);
        initRef.setStoragePath(null);
        uploadPromises.push(initRef.uploadToFirebase());
        
        const styleRef = this.styleRefImage();
        styleRef.setDataUrl(mjStyleImageUrl);
        styleRef.setImageLabel("Midjourney artistic interpretation (re-uploaded)");
        // Clear the old URL to force a new upload
        styleRef.setPublicUrl(null);
        styleRef.setStoragePath(null);
        uploadPromises.push(styleRef.uploadToFirebase());
        
        await Promise.all(uploadPromises);
        
        // Verify uploads succeeded
        if (!initRef.hasPublicUrl()) {
            throw new Error("Failed to re-upload OpenAI image to Firebase");
        }
        
        if (!styleRef.hasPublicUrl()) {
            throw new Error("Failed to re-upload Midjourney style image to Firebase");
        }
        
        this.setStatus("images re-uploaded successfully");
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

    // Delegate methods from PiAPI prompt
    onImagePromptSuccess (prompt) {
        // We handle final results directly after await, so just update status here
        if (prompt === this.piApiStylePrompt()) {
            // Style generation completed - will be used in final transfer
            this.setStatus("Midjourney style image ready");
        }
        // Don't handle piApiFinalPrompt here - we handle it after await
    }

    onImagePromptImageLoaded (prompt, aiImage) {
        // Called when an individual image loads
        // We handle final results directly after await, so just update status here
        if (prompt === this.openAiPrompt()) {
            // OpenAI image loaded - will be used as base
            this.setStatus("OpenAI image ready");
        } else if (prompt === this.piApiStylePrompt()) {
            // Style image loaded - will be used as style reference
            this.setStatus("Midjourney style image ready");
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
        return this.prompt() !== null && 
               this.prompt().trim() !== "" && 
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
        if (this.piApiStylePrompt()) {
            this.piApiStylePrompt().shutdown();
        }
        if (this.piApiFinalPrompt()) {
            this.piApiFinalPrompt().shutdown();
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