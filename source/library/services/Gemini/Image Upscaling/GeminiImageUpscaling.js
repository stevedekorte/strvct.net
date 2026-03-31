"use strict";

/**
 * @module library.services.Gemini.Image_Upscaling
 */

/**
 * @class GeminiImageUpscaling
 * @extends SvSummaryNode
 * @classdesc Upscales an input image using Google's Imagen API via Vertex AI.
 * Supports target width, aspect ratio selection, and optional prompt guidance
 * for outpainting when the aspect ratio differs from the source.
 */

(class GeminiImageUpscaling extends SvSummaryNode {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("inputImageNode", null);
            slot.setFinalInitProto("SvImageNode");
            slot.setLabel("Input Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setDescription("Drop an image here to upscale.");
        }

        {
            const slot = this.newSlot("prompt", "");
            slot.setSlotType("String");
            slot.setLabel("Prompt");
            slot.setDescription("Optional text prompt to guide the upscale and outpainting.");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
        }

        {
            const validItems = [
                { value: "16:9", label: "16:9" },
                { value: "1:1", label: "1:1" },
                { value: "9:16", label: "9:16" },
                { value: "4:3", label: "4:3" },
                { value: "3:4", label: "3:4" },
                { value: "3:2", label: "3:2" },
                { value: "2:3", label: "2:3" },
            ];
            const slot = this.newSlot("aspectRatio", validItems.first().value);
            slot.setSlotType("String");
            slot.setLabel("Aspect Ratio");
            slot.setDescription("Target aspect ratio for the upscaled image.");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        {
            const validItems = [
                { value: 1024, label: "1024" },
                { value: 2048, label: "2048" },
                { value: 4096, label: "4096" },
            ];
            const slot = this.newSlot("outputWidth", 2048);
            slot.setSlotType("Number");
            slot.setLabel("Output Width");
            slot.setDescription("Target width in pixels for the upscaled image.");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        {
            const modelNames = ["imagen-4.0-generate-001", "imagen-3.0-generate-002"];
            const slot = this.newSlot("upscaleModel", modelNames.first());
            slot.setSlotType("String");
            slot.setLabel("Model");
            slot.setDescription("The Imagen model to use for upscaling.");
            slot.setValidValues(modelNames);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("outputImageNode", null);
            slot.setFinalInitProto("SvImageNode");
            slot.setLabel("Output Image");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
            slot.setDescription("The upscaled result image.");
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
        this.setTitle("Image Upscaling");
    }

    finalInit () {
        super.finalInit();
        this.inputImageNode().setTitle("Input Image");
        this.outputImageNode().setTitle("Output Image");
    }

    title () {
        return "Image Upscaling";
    }

    subtitle () {
        const parts = [
            this.outputWidth() + "px",
            this.aspectRatio()
        ];
        if (this.status()) {
            parts.push(this.status());
        }
        if (this.error()) {
            parts.push("ERROR: " + this.error());
        }
        return parts.join(" · ");
    }

    // --- Service ---

    service () {
        return GeminiService.shared();
    }

    projectId () {
        return this.service().projectId();
    }

    locationId () {
        return this.service().locationId();
    }

    apiUrl () {
        if (!this.projectId()) {
            this.setError("No project ID. Check GeminiService configuration.");
            return null;
        }
        return `https://${this.locationId()}-aiplatform.googleapis.com/v1/projects/${this.projectId()}/locations/${this.locationId()}/publishers/google/models/${this.upscaleModel()}:predict`;
    }

    proxiedApiUrl () {
        return ProxyServers.shared().defaultServer().proxyUrlForUrl(this.apiUrl());
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
            const base64Data = dataUrl.after("base64,");

            const body = this.requestBodyWithBase64(base64Data);

            const apiKey = await this.service().apiKeyOrUserAuthToken();
            const url = this.proxiedApiUrl();

            this.setStatus("Uploading and upscaling...");

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            this.handleResponse(data);

        } catch (e) {
            this.setStatus("Failed");
            this.setError(e.message);
            console.error("GeminiImageUpscaling error:", e);
        }
    }

    requestBodyWithBase64 (base64Data) {
        const instance = {
            image: {
                bytesBase64Encoded: base64Data
            }
        };

        if (this.prompt().length > 0) {
            instance.prompt = this.prompt();
        }

        return {
            instances: [instance],
            parameters: {
                sampleCount: 1,
                mode: "upscale",
                aspectRatio: this.aspectRatio(),
                upscaleConfig: {
                    upscaleFactor: "x2"
                },
                outputOptions: {
                    mimeType: "image/png"
                },
                personGeneration: "allow_adult"
            }
        };
    }

    handleResponse (data) {
        if (data.predictions && data.predictions.length > 0) {
            const prediction = data.predictions[0];
            const mimeType = prediction.mimeType || "image/png";
            const outputDataUrl = "data:" + mimeType + ";base64," + prediction.bytesBase64Encoded;
            this.outputImageNode().setDataURL(outputDataUrl);
            this.setStatus("Complete");
        } else {
            this.setStatus("Failed");
            this.setError("No predictions in response.");
        }
    }

}.initThisClass());
