"use strict";

/**
 * @module library.services.Gemini
 * @class SvGeminiJsonRequest
 * @extends SvSummaryNode
 * @classdesc One structured request to a Gemini chat model, outside any
 * conversation: a prompt in, a parsed JSON value out (generateContent with
 * a JSON response type, optionally constrained by a response schema).
 *
 * Transport is fetch, so it runs the same in a browser and under Node. By
 * default it goes through the proxy server with the user's bearer token, and
 * the proxy meters it like any chat call. A tool running outside the app
 * (a server script with its own key) calls setUsesProxy(false) and sets the
 * service's api key; the request then goes straight to the vendor.
 *
 * Usage:
 *     const json = await SvGeminiJsonRequest.clone()
 *         .setPrompt("…")
 *         .asyncSendForJson();
 */
(class SvGeminiJsonRequest extends SvSummaryNode {

    static jsonSchemaDescription () {
        return "A single structured JSON request to a Gemini chat model.";
    }

    initPrototypeSlots () {
        {
            /**
             * @member {string} modelId - The chat model to ask.
             * @category Request
             */
            const slot = this.newSlot("modelId", "gemini-3.8-flash");
            slot.setSlotType("String");
        }

        {
            /**
             * @member {string} prompt - The whole request, as one user turn.
             * @category Request
             */
            const slot = this.newSlot("prompt", "");
            slot.setSlotType("String");
        }

        {
            /**
             * @member {Object} responseSchema - Optional OpenAPI-style schema
             * the response must match (generationConfig.responseSchema).
             * @category Request
             */
            const slot = this.newSlot("responseSchema", null);
            slot.setSlotType("JSON Object");
            slot.setAllowsNullValue(true);
        }

        {
            /**
             * @member {boolean} usesProxy - Send through the proxy server (the
             * app's path) rather than straight to the vendor with an api key.
             * @category Transport
             */
            const slot = this.newSlot("usesProxy", true);
            slot.setSlotType("Boolean");
        }

        {
            /**
             * @member {Object} usageMetadata - The vendor's token counts for
             * the last response, or null.
             * @category Response
             */
            const slot = this.newSlot("usageMetadata", null);
            slot.setSlotType("JSON Object");
            slot.setAllowsNullValue(true);
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setShouldStoreSubnodes(false);
        this.setTitle("Gemini JSON Request");
    }

    /**
     * @description The service that authenticates this request.
     * @returns {SvGeminiService}
     * @category Transport
     */
    service () {
        return SvGeminiService.shared();
    }

    /**
     * @description The vendor endpoint for the model.
     * @returns {string}
     * @category Transport
     */
    vendorUrl () {
        return "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(this.modelId()) + ":generateContent";
    }

    /**
     * @description The url the request is sent to.
     * @returns {string}
     * @category Transport
     */
    requestUrl () {
        return this.usesProxy() ? this.service().proxiedUrl(this.vendorUrl()) : this.vendorUrl();
    }

    /**
     * @description Headers: the proxy's bearer token, or the vendor key.
     * @returns {Promise<Object>}
     * @category Transport
     */
    async asyncHeaders () {
        if (this.usesProxy()) {
            return this.service().fetchHeadersForProxy();
        }
        return { "Content-Type": "application/json", "x-goog-api-key": this.service().apiKey() };
    }

    /**
     * @description The generateContent body.
     * @returns {Object}
     * @category Request
     */
    bodyJson () {
        const generationConfig = { responseMimeType: "application/json" };
        if (this.responseSchema()) {
            generationConfig.responseSchema = this.responseSchema();
        }
        return { contents: [{ role: "user", parts: [{ text: this.prompt() }] }], generationConfig: generationConfig };
    }

    /**
     * @description Sends the request and returns the parsed JSON answer.
     * Throws on a transport error, a vendor error, a blocked or empty
     * answer, or text that isn't JSON — never returns a partial value.
     * @returns {Promise<*>}
     * @category Sending
     */
    async asyncSendForJson () {
        assert(this.prompt().length > 0, this.svType() + " prompt is empty");
        const response = await fetch(this.requestUrl(), { method: "POST", headers: await this.asyncHeaders(), body: JSON.stringify(this.bodyJson()) });
        if (!response.ok) {
            throw new Error(this.svType() + " HTTP " + response.status + ": " + (await response.text()).slice(0, 500));
        }
        return this.jsonFromResponseJson(await response.json());
    }

    /**
     * @description The parsed answer inside a generateContent response.
     * @param {Object} json - The response body.
     * @returns {*}
     * @category Response
     */
    jsonFromResponseJson (json) {
        this.setUsageMetadata(json.usageMetadata || null);
        const text = this.answerTextIn(json);
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(this.svType() + " answer is not JSON: " + e.message + " — " + text.slice(0, 200));
        }
    }

    /**
     * @description The answer text of the first candidate (thought parts
     * excluded). Throws when the answer was blocked or is empty.
     * @param {Object} json - The response body.
     * @returns {string}
     * @category Response
     */
    answerTextIn (json) {
        const candidate = (json.candidates || [])[0];
        const parts = (candidate && candidate.content && candidate.content.parts) || [];
        const text = parts.filter(part => !part.thought && Type.isString(part.text)).map(part => part.text).join("");
        if (text.trim().length === 0) {
            const reason = (candidate && candidate.finishReason) || (json.promptFeedback && json.promptFeedback.blockReason) || "no candidates";
            throw new Error(this.svType() + " got no answer (" + reason + ")");
        }
        return text;
    }

}.initThisClass());
