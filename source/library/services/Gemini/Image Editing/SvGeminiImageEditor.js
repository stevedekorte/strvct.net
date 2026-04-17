"use strict";

/**
 * @module library.services.Gemini.Image_Editing
 */

/**
 * @class SvGeminiImageEditor
 * @extends SvAiImageEditor
 * @classdesc Edits images using Gemini's generative image models via the chat endpoint.
 * Sends the input image with a text prompt to produce an edited output.
 * Uses the generativelanguage.googleapis.com endpoint with responseModalities: ["IMAGE"].
 */

(class SvGeminiImageEditor extends SvAiImageEditor {

    initPrototypeSlots () {

        {
            const slot = this.newSlot("prompt", "Enhance this image while preserving its content and composition.");
            slot.setSlotType("String");
            slot.setLabel("Prompt");
            slot.setDescription("Text prompt to guide the image editing.");
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
            slot.setDescription("Target aspect ratio for the output image.");
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
            slot.setDescription("Target resolution for the output image.");
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
            const slot = this.newSlot("editModel", modelNames.first());
            slot.setSlotType("String");
            slot.setLabel("Model");
            slot.setDescription("The Gemini model to use for image editing.");
            slot.setValidValues(modelNames);
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
        }
    }

    initPrototype () {
        this.setTitle("Image Editor");
    }

    title () {
        return "Image Editor";
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
        url = url.replaceAll("{model id}", this.editModel());
        url = url.replaceAll("{generate response method}", "generateContent");

        const apiKey = await this.service().apiKeyOrUserAuthToken();
        if (apiKey && !apiKey.startsWith("eyJ")) {
            url = url.replaceAll("{api key}", apiKey);
        } else {
            url = url.replace("?key={api key}", "");
        }

        return url;
    }

    // --- Request ---

    async sendRequest (base64Data, mimeType) {
        const body = {
            contents: [{
                parts: [
                    { text: this.prompt() },
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
        this.setStatus("Editing image...");

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
