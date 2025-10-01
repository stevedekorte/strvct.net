"use strict";

/**
 * @module library.services.OpenAI.StyleTransfers
 */

/**
 * @class OpenAiStyleTransfer
 * @extends SvSummaryNode
 * @classdesc OpenAI style transfer using style reference images.
 *
 * This class implements style transfer using OpenAI's image generation API.
 * It provides a simpler alternative to the Midjourney style transfer approach.
 *
 * How it works:
 * - Takes a content prompt describing what to generate
 * - Requires a style reference image (drop, paste, or upload)
 * - Optionally takes a style description to refine the style application
 * - Uses OpenAI's reference-image conditioning to apply the style
 *
 * OpenAI's gpt-image-1 model supports using images as style references
 * alongside text prompts to guide the generation toward a specific look
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

(class OpenAiStyleTransfer extends SvSummaryNode {

    /**
     * @description Initializes the prototype slots for the OpenAiStyleTransfer class.
     */
    initPrototypeSlots () {

        // Content prompt (what to generate)
        {
            const slot = this.newSlot("contentPrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Content Prompt");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }

        // Style prompt (optional description to guide style application)
        {
            const slot = this.newSlot("stylePrompt", "");
            slot.setSlotType("String");
            slot.setLabel("Style Description (Optional)");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
        }

        // Style reference image storage
        {
            const slot = this.newSlot("styleRefImage", null);
            slot.setFinalInitProto(SvImage); // FIXME: update code to use Firestore
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
        }

        // Style image data URL (for drag and drop) - REQUIRED
        {
            const slot = this.newSlot("styleImageDataUrl", null);
            slot.setSlotType("String");
            slot.setLabel("Style Image (Required)");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setFieldInspectorViewClassName("SvImageWellField");
        }


        // Model selection
        {
            const slot = this.newSlot("model", "gpt-image-1");
            slot.setSlotType("String");
            slot.setLabel("Model");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidValues(["gpt-image-1"]);
        }

        // Image size
        {
            const slot = this.newSlot("imageSize", "1024x1024");
            slot.setSlotType("String");
            slot.setLabel("Image Size");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidValues(["1024x1024", "1024x1536", "1536x1024", "auto"]);
        }

        // Quality
        {
            const slot = this.newSlot("quality", "standard");
            slot.setSlotType("String");
            slot.setLabel("Quality");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidValues(["standard", "hd"]);
        }

        // Style strength (0-1, how much to follow the style)
        {
            const slot = this.newSlot("styleStrength", 0.7);
            slot.setSlotType("Number");
            slot.setLabel("Style Strength");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setValidItems([
                { value: 0.1, label: "Very Subtle (0.1)" },
                { value: 0.3, label: "Subtle (0.3)" },
                { value: 0.5, label: "Moderate (0.5)" },
                { value: 0.7, label: "Strong (0.7)" },
                { value: 0.9, label: "Very Strong (0.9)" },
                { value: 1.0, label: "Maximum (1.0)" }
            ]);
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
            const slot = this.newSlot("generateAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Start Style Transfer");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("generate");
        }

        // Upload style image action
        {
            const slot = this.newSlot("uploadStyleImageAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Upload Style Image");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("uploadStyleImage");
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
        if (this.styleRefImage()) {
            this.styleRefImage().setTitle("Style Reference Image");
        }
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
     * @description Called when style image data URL is updated
     * @category Handlers
     */
    didUpdateSlot (slot, oldValue, newValue) {
        super.didUpdateSlot(slot, oldValue, newValue);

        if (slot.name() === "styleImageDataUrl" && newValue) {
            // Clear the style prompt since we now have an image
            this.setStylePrompt("");
            this.setStatus("Style image dropped - ready to transfer");
        }
    }

    /**
     * @description Sets the prompt for backward compatibility
     * @param {string} prompt - The prompt to set
     * @returns {this} The current instance
     * @category Setup
     */
    setPrompt (prompt) {
        // Try to parse structured prompts
        if (prompt && prompt.includes("Create an image with the attributes described by this JSON")) {
            try {
                const jsonMatch = prompt.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonObj = JSON.parse(jsonMatch[0]);

                    // Extract content (scene)
                    if (jsonObj.scene) {
                        this.setContentPrompt(jsonObj.scene);
                    }

                    // Extract style
                    if (jsonObj.artStyle) {
                        let style = jsonObj.artStyle;
                        // Clean up common prefixes
                        style = style.replace(/^Inspired by the /, "");
                        style = style.replace(/^in the style of /, "");
                        this.setStylePrompt(style);
                    }

                    return this;
                }
            } catch (e) {
                console.warn("Failed to parse JSON prompt, using as single prompt:", e);
            }
        }

        // If it's not JSON or parsing failed, use the prompt as content
        this.setContentPrompt(prompt);
        this.setStylePrompt("artistic illustration");

        return this;
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
    async generate () {
        try {
            this.setError("");
            this.setStatus("generating OpenAI style transfer...");

            // Check if OpenAI service has API key
            if (!this.service().hasApiKey()) {
                throw new Error("OpenAI API key is not configured. Please set your API key in OpenAI Service settings.");
            }

            // Validate inputs
            if (!this.contentPrompt() || this.contentPrompt().trim() === "") {
                throw new Error("Content prompt is required");
            }

            // Step 1: Handle style reference image
            // OpenAI's gpt-image-1 supports using images as style references

            let styleImageUrl = null;
            let styleImageDataUrl = null;

            // Check if we have a dropped/pasted style image data URL
            if (this.styleImageDataUrl()) {
                // Upload the dropped image to Firebase for URL access
                this.setStatus("uploading style reference image...");
                this.styleRefImage().setDataUrl(this.styleImageDataUrl());
                this.styleRefImage().setImageLabel("Style reference image");
                await this.styleRefImage().uploadToFirebase();
                styleImageUrl = this.styleRefImage().publicUrl();
                styleImageDataUrl = this.styleImageDataUrl();
                console.log("Uploaded style reference image:", styleImageUrl);
            } else if (this.styleRefImage() && this.styleRefImage().hasPublicUrl()) {
                // Use existing uploaded style image
                styleImageUrl = this.styleRefImage().publicUrl();
                styleImageDataUrl = this.styleRefImage().dataUrl();
                console.log("Using existing style reference image:", styleImageUrl);
            } else if (this.styleRefImage() && this.styleRefImage().hasDataUrl()) {
                // Upload existing style image data to Firebase
                this.setStatus("uploading style reference image...");
                await this.styleRefImage().uploadToFirebase();
                styleImageUrl = this.styleRefImage().publicUrl();
                styleImageDataUrl = this.styleRefImage().dataUrl();
                console.log("Uploaded style reference image:", styleImageUrl);
            }

            // Step 2: Generate final image with style reference
            this.setStatus("generating styled image...");
            this.sendDelegateMessage("onImagePromptLoading");

            // Build the prompt that combines content and optional style description
            let combinedPrompt = this.contentPrompt();

            // Add optional style description to guide the style application
            if (this.stylePrompt() && this.stylePrompt().trim() !== "") {
                combinedPrompt += ` in the style of ${this.stylePrompt()}`;

                // Apply style strength by adjusting the prompt emphasis
                if (this.styleStrength() < 0.5) {
                    combinedPrompt += " with subtle stylistic elements";
                } else if (this.styleStrength() > 0.8) {
                    combinedPrompt += " with strong emphasis on the artistic style";
                }
            }

            // Check if we have a style image
            if (!styleImageUrl && !styleImageDataUrl) {
                throw new Error("Style reference image is required. Please drop or upload a style image.");
            }

            console.log("Using style reference image for generation");
            console.log("Final prompt:", combinedPrompt);

            // Make API call with style reference
            await this.generateWithStyleReference(combinedPrompt, styleImageUrl, styleImageDataUrl);

        } catch (error) {
            console.error("OpenAI style transfer failed:", error);
            this.setError(error.message);
            this.setStatus("failed");
            this.sendDelegateMessage("onImagePromptError");
        }
    }

    /**
     * @description Generates an image with a style reference
     * @param {string} prompt - The text prompt
     * @param {string} styleImageUrl - The Firebase URL of the style image
     * @param {string} styleImageDataUrl - The data URL of the style image
     * @returns {Promise<void>}
     * @category Generation
     */
    async generateWithStyleReference (prompt, styleImageUrl, styleImageDataUrl) {
        try {
            const apiKey = await this.service().apiKeyOrUserAuthToken();

            // Step 1: Upload the style image to OpenAI to get an internal ID
            console.log("=== OpenAI Style Transfer - Uploading Style Image ===");
            const uploadEndpoint = "https://api.openai.com/v1/images/uploads";

            // Convert data URL to blob for upload
            const base64Data = styleImageDataUrl.split(",")[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "image/png" });

            // Create FormData for upload
            const formData = new FormData();
            formData.append("image", blob, "style.png");
            formData.append("purpose", "style_reference");

            const uploadProxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(uploadEndpoint);

            const uploadResponse = await fetch(uploadProxyEndpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`
                },
                body: formData
            });

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(`Upload error: ${uploadData.error?.message || uploadResponse.statusText}`);
            }

            // Get the internal image ID from the upload response
            const styleImageId = uploadData.id;
            console.log("Style image uploaded with ID:", styleImageId);

            // Step 2: Generate image using the style reference ID
            console.log("=== OpenAI Style Transfer - Generating Image ===");
            const generationEndpoint = "https://api.openai.com/v1/images/generations";

            const bodyJson = {
                model: this.model(),
                prompt: prompt,
                size: this.imageSize(),
                referenced_image_ids: [styleImageId]
            };

            // Add optional style description to enhance the style application
            if (this.stylePrompt() && this.stylePrompt().trim() !== "") {
                bodyJson.prompt = `${prompt} in the style of ${this.stylePrompt()}`;
            }

            console.log("Prompt sent to OpenAI:", bodyJson.prompt);
            console.log("Referenced image IDs:", bodyJson.referenced_image_ids);
            console.log("Full API request body:", JSON.stringify(bodyJson, null, 2));

            const generationProxyEndpoint = ProxyServers.shared().defaultServer().proxyUrlForUrl(generationEndpoint);

            const response = await fetch(generationProxyEndpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bodyJson)
            });

            const resultData = await response.json();

            if (!response.ok) {
                throw new Error(`API error: ${resultData.error?.message || response.statusText}`);
            }

            // Process the result
            if (resultData.data && resultData.data.length > 0) {
                const imageData = resultData.data[0];
                const imageUrl = imageData.url || imageData.b64_json;

                if (imageUrl) {
                    // If it's base64, convert to data URL
                    const finalUrl = imageData.b64_json ?
                        `data:image/png;base64,${imageData.b64_json}` :
                        imageUrl;

                    this.setResultDataUrl(finalUrl);
                    this.setStatus("style transfer complete");

                    // Create a mock image object for the delegate
                    const resultImage = {
                        imageUrl: () => finalUrl
                    };

                    this.sendDelegateMessage("onImagePromptImageLoaded", [this, resultImage]);
                    this.sendDelegateMessage("onImagePromptEnd", [this]);
                } else {
                    throw new Error("No image URL in response");
                }
            } else {
                throw new Error("No images generated");
            }

        } catch (error) {
            console.error("Style reference generation failed:", error);
            throw error;
        }
    }

    /**
     * @description Uploads a style image from file selection.
     * @returns {Promise<void>}
     * @category Actions
     */
    async uploadStyleImage () {
        try {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";

            const fileSelected = new Promise((resolve, reject) => {
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    } else {
                        reject(new Error("No file selected"));
                    }
                };
            });

            input.click();
            const dataUrl = await fileSelected;

            this.styleRefImage().setDataUrl(dataUrl);
            this.styleRefImage().setImageLabel("Uploaded style reference");

            this.setStatus("Style image ready for upload");

        } catch (error) {
            console.error("Failed to select style image:", error);
            this.setError("Failed to select style image: " + error.message);
        }
    }

    /**
     * @description Shuts down the style transfer process.
     * @returns {this} The current instance.
     * @category Lifecycle
     */
    shutdown () {
        return this;
    }

    /**
     * @description Gets action info for the generate action.
     * @returns {Object} Action info.
     * @category Actions
     */
    generateActionInfo () {
        const hasContent = !!(this.contentPrompt() && this.contentPrompt().trim() !== "");
        const hasStyleImage = !!((this.styleRefImage() && this.styleRefImage().hasDataUrl()) ||
                               (this.styleImageDataUrl() !== null && this.styleImageDataUrl() !== ""));

        return {
            isEnabled: hasContent && hasStyleImage,
            isVisible: true
        };
    }

    /**
     * @description Gets action info for the upload style image action.
     * @returns {Object} Action info.
     * @category Actions
     */
    uploadStyleImageActionInfo () {
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
        this.setStyleImageDataUrl(null);

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

        if (this.resultDataUrl()) {
            return "Complete";
        }

        if (this.status()) {
            return this.status();
        }

        if (this.styleImageDataUrl()) {
            return "Style image dropped";
        }

        if (this.styleRefImage() && this.styleRefImage().hasDataUrl()) {
            return "Style image ready";
        }

        return "Ready";
    }

}.initThisClass());
