"use strict";

/**
 * @module library.services.Gemini.Image_Upscaling
 */

/**
 * @class SvGeminiImageScaler
 * @extends SvAiImageEditor
 * @classdesc Upscales images using Gemini's image generation models via the chat endpoint.
 * When the target aspect ratio differs from the source, sends the original image
 * with an outpainting prompt and lets Gemini extend it natively via imageConfig.
 * Uses the generativelanguage.googleapis.com endpoint with responseModalities: ["IMAGE"].
 */

(class SvGeminiImageScaler extends SvAiImageEditor {

    initPrototypeSlots () {

        {
            const validItems = [
                { value: "1:1", label: "1:1" },
                { value: "16:9", label: "16:9" },
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
                { value: "1K", label: "1K" },
                { value: "2K", label: "2K" },
                { value: "4K", label: "4K" },
            ];
            const slot = this.newSlot("imageSize", "2K");
            slot.setSlotType("String");
            slot.setLabel("Output Size");
            slot.setDescription("Target resolution for the upscaled image.");
            slot.setValidItems(validItems);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }

        {
            const modelNames = [
                "gemini-3.1-flash-image-preview",
                "gemini-3-pro-image-preview"
            ];
            const slot = this.newSlot("scaleModel", modelNames.first());
            slot.setSlotType("String");
            slot.setLabel("Model");
            slot.setDescription("The Gemini model to use for upscaling.");
            slot.setValidValues(modelNames);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }
    }

    initPrototype () {
        this.setTitle("Image Scaler");
    }

    title () {
        return "Image Scaler";
    }

    subtitleParts () {
        return [this.imageSize(), this.aspectRatio()];
    }

    // --- Service ---

    service () {
        return SvGeminiService.shared();
    }

    // --- API URL ---

    async apiUrl () {
        let url = this.service().endPointUrlFormat();
        url = url.replaceAll("{model id}", this.scaleModel());
        url = url.replaceAll("{generate response method}", "generateContent");

        const apiKey = await this.service().apiKeyOrUserAuthToken();
        if (apiKey && !apiKey.startsWith("eyJ")) {
            url = url.replaceAll("{api key}", apiKey);
        } else {
            url = url.replace("?key={api key}", "");
        }

        return url;
    }

    // --- Prompts ---

    upscalePrompt () {
        return "Generate an exact copy of this image at higher resolution. Do not change, add, remove, or reinterpret any element. Reproduce every detail, shape, and composition pixel-perfectly. Keep all colors exactly the same — do not shift hues, adjust saturation, change brightness, or alter the color palette in any way.";
    }

    outpaintPrompt () {
        return "Reproduce this image exactly as-is in the center, keeping all existing content, colors, and details completely unchanged. Extend the scene naturally beyond the original edges to fill the new aspect ratio, seamlessly blending with the existing content in style, lighting, and color palette.";
    }

    // --- Aspect Ratio Detection ---

    /**
     * @description Loads an HTMLImageElement from a data URL to read its dimensions.
     * @param {string} dataUrl - The image data URL.
     * @returns {Promise<HTMLImageElement>} The loaded image element.
     * @category Image
     */
    asyncLoadImage (dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error("Failed to load image: " + e));
            img.src = dataUrl;
        });
    }

    /**
     * @description Checks whether the source image aspect ratio differs from the target.
     * @param {HTMLImageElement} img - The source image.
     * @returns {boolean} True if outpainting is needed.
     * @category Image
     */
    needsOutpainting (img) {
        const sourceRatio = img.width / img.height;
        const parts = this.aspectRatio().split(":");
        const targetRatio = Number(parts[0]) / Number(parts[1]);
        const tolerance = 0.02;
        return Math.abs(sourceRatio - targetRatio) > tolerance;
    }

    // --- Request ---

    async sendRequest (base64Data, mimeType) {
        const dataUrl = "data:" + mimeType + ";base64," + base64Data;
        const img = await this.asyncLoadImage(dataUrl);
        const outpainting = this.needsOutpainting(img);
        const prompt = outpainting ? this.outpaintPrompt() : this.upscalePrompt();

        const body = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                responseModalities: ["IMAGE"],
                imageConfig: {
                    aspectRatio: this.aspectRatio(),
                    imageSize: this.imageSize()
                }
            }
        };

        const url = this.proxiedUrl(await this.apiUrl());
        this.setStatus(outpainting ? "Outpainting image..." : "Upscaling image...");

        const response = await fetch(url, {
            method: "POST",
            headers: await this.fetchHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        this.handleGeminiImageResponse(data);
    }

}.initThisClass());
