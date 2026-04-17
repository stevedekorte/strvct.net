"use strict";

/**
 * @module library.services.AiServiceKit.ImageEditor
 */

/**
 * @class SvAiImageEditor
 * @extends SvSummaryNode
 * @classdesc Abstract base class for AI-powered image editing operations.
 * Provides shared slots for input/output images, status, error, and a generate action.
 * Subclasses implement specific editing or scaling behavior.
 */

(class SvAiImageEditor extends SvSummaryNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("inputImageNode", null);
            slot.setFinalInitProto("SvImageNode");
            slot.setLabel("Input Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("Drop an image here.");
        }

        {
            const slot = this.newSlot("outputImageNode", null);
            slot.setFinalInitProto("SvImageNode");
            slot.setLabel("Output Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
            slot.setDescription("The result image.");
        }

        {
            const slot = this.newSlot("status", "");
            slot.setSlotType("String");
            slot.setLabel("Status");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setLabel("Error");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("generateAction", null);
            slot.setLabel("Generate");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("generate");
        }
    }

    initPrototype () {
        this.setCanDelete(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.inputImageNode().setTitle("Input Image");
        this.outputImageNode().setTitle("Output Image");
    }

    subtitle () {
        const parts = this.subtitleParts();
        if (this.status()) {
            parts.push(this.status());
        }
        if (this.error()) {
            parts.push("ERROR: " + this.error());
        }
        return parts.join(" · ");
    }

    /**
     * @description Override in subclasses to provide model-specific subtitle parts.
     * @returns {Array} Array of strings to join for subtitle.
     * @category Display
     */
    subtitleParts () {
        return [];
    }

    // --- Service ---

    /**
     * @description Override in subclasses to return the appropriate service.
     * @returns {SvAiService}
     * @category Service
     */
    service () {
        throw new Error("Subclass must override service()");
    }

    // --- Validation ---

    canGenerate () {
        return this.inputImageNode().hasImage();
    }

    generateActionInfo () {
        return {
            isEnabled: this.canGenerate(),
            isVisible: true
        };
    }

    // --- Generation ---

    /**
     * @description Main generate method. Validates input, prepares data, calls sendRequest.
     * @category Generation
     */
    async generate () {
        this.setStatus("Preparing...");
        this.setError(null);

        if (!this.canGenerate()) {
            this.setError("No input image provided.");
            this.setStatus("");
            return;
        }

        try {
            const dataUrl = await this.inputImageNode().asyncDataUrl();
            const mimeType = dataUrl.between("data:", ";base64,");
            const base64Data = dataUrl.after("base64,");

            await this.sendRequest(base64Data, mimeType);

        } catch (e) {
            this.setStatus("Failed");
            this.setError(e.message);
            console.error(this.svType() + " error:", e);
        }
    }

    /**
     * @description Override in subclasses to perform the actual API request.
     * @param {string} base64Data - Base64 encoded image data.
     * @param {string} mimeType - MIME type of the image.
     * @category Generation
     */
    async sendRequest (base64Data, mimeType) {
        throw new Error("Subclass must override sendRequest()");
    }

    /**
     * @description Builds a proxied API URL from a raw API URL.
     * @param {string} url - The raw API URL.
     * @returns {string} The proxied URL.
     * @category API
     */
    proxiedUrl (url) {
        return SvProxyServers.shared().defaultServer().proxyUrlForUrl(url);
    }

    /**
     * @description Builds standard fetch headers with auth token.
     * @returns {Object} Headers object.
     * @category API
     */
    async fetchHeaders () {
        const headers = {
            "Content-Type": "application/json"
        };

        const token = await this.service().apiKeyOrUserAuthToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * @description Handles a Gemini-style response containing inline image data.
     * @param {Object} data - The API response JSON.
     * @category Response
     */
    handleGeminiImageResponse (data) {
        const responseObj = Array.isArray(data) ? data[data.length - 1] : data;
        const candidates = responseObj.candidates;

        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content.parts;
            const imagePart = parts.find(p => p.inlineData);

            if (imagePart) {
                const mimeType = imagePart.inlineData.mimeType || "image/png";
                const outputDataUrl = "data:" + mimeType + ";base64," + imagePart.inlineData.data;
                this.outputImageNode().setDataURL(outputDataUrl);
                this.setStatus("Complete");
                return;
            }
        }

        this.setStatus("Failed");
        this.setError("No image in response.");
    }

}.initThisClass());
