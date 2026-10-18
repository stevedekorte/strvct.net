"use strict";

/**
 * @module library.services.AiServiceKit.Vision
 */

/**
 * @class SvVisionQuery
 * @extends ProtoClass
 * @classdesc One question about one image, answered in text by a vision
 * model: a description of what the image shows, or the answer to a specific
 * question. Provider-neutral — each service builds its own image part
 * (SvAiService.visionUserContent) — and when the chosen model's request
 * fails, it asks the failover model once.
 *
 * Which models answer is the app's choice, made once at startup:
 *
 *     SvVisionQuery.setDescribeChatModelName("…");
 *     SvVisionQuery.setQuestionChatModelName("…");
 *     SvVisionQuery.setFailoverChatModelName("…");
 *
 * Unset, a query uses the default chat model.
 *
 * Usage: `await SvVisionQuery.describing(dataUrl).asyncAnswer()` or
 * `await SvVisionQuery.asking(dataUrl, "How many people are there?").asyncAnswer()`
 * (SvImageNode_vision wraps both).
 */
(class SvVisionQuery extends ProtoClass {

    static initClass () {
        this.newClassSlot("describeChatModelName", null);
        this.newClassSlot("questionChatModelName", null);
        this.newClassSlot("failoverChatModelName", null);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("dataUrl", null); // the image, as a data URL
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("instruction", ""); // how to look (the system message)
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("prompt", ""); // what to answer (the user message's text)
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("chatModelName", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("timeoutMs", 90 * 1000);
            slot.setSlotType("Number");
        }
    }

    // --- the two kinds of query ---

    /**
     * @description A query for a literal, count-first description of the image.
     * @param {String} dataUrl
     * @returns {SvVisionQuery}
     * @category Construction
     */
    static describing (dataUrl) {
        return this.clone().setDataUrl(dataUrl).setInstruction(this.describeInstruction())
            .setPrompt("Describe this image.").setChatModelName(this.describeChatModelName());
    }

    /**
     * @description A query for the answer to one question about the image.
     * @param {String} dataUrl
     * @param {String} question
     * @returns {SvVisionQuery}
     * @category Construction
     */
    static asking (dataUrl, question) {
        return this.clone().setDataUrl(dataUrl).setInstruction(this.questionInstruction())
            .setPrompt(question).setChatModelName(this.questionChatModelName());
    }

    static describeInstruction () {
        return [
            "You describe images literally, for someone who cannot see them and needs to check them against what was intended.",
            "Say only what is visible. Never what the image seems meant to show, and never a judgement of its quality.",
            "Begin with the count: \"People or creatures: N.\" Then one line per figure, left to right: its heads, arms, legs and any other notable anatomy (count each), apparent age and sex, species or kind, build, clothing, and what it holds or wears.",
            "Then one line each for: the setting, any text that appears, and the style (photo, painting, drawing...).",
            "Count carefully, and write \"unclear\" rather than guess. Plain lines, no markdown."
        ].join(" ");
    }

    static questionInstruction () {
        return [
            "You answer questions about an image, for someone who cannot see it.",
            "Answer from what is visible only. Lead with the direct answer (a number, yes or no, a name), then one short sentence of evidence.",
            "If it cannot be told from the image, say so. Plain text, no markdown."
        ].join(" ");
    }

    // --- asking ---

    /**
     * @description Asks the chosen model; if its request fails, asks the
     * failover model once. Resolves to the answer text.
     * @returns {Promise<String>}
     * @category Query
     */
    async asyncAnswer () {
        const primary = this.modelNamed(this.chatModelName()) || SvServices.shared().defaultChatModel();
        try {
            return await this.asyncAnswerWith(primary);
        } catch (error) {
            const failover = this.modelNamed(this.thisClass().failoverChatModelName());
            if (!failover || failover === primary) {
                throw error;
            }
            console.warn(this.svType() + ": " + primary.modelName() + " failed (" + error.message + "); asking " + failover.modelName());
            return await this.asyncAnswerWith(failover);
        }
    }

    modelNamed (name) {
        return name ? SvServices.shared().chatModelWithName(name) : null;
    }

    /**
     * @description One request to one model.
     * @param {SvAiChatModel} chatModel
     * @returns {Promise<String>}
     * @category Query
     */
    async asyncAnswerWith (chatModel) {
        const request = chatModel.newChatRequest();
        request.setBodyJson({ model: chatModel.modelName(), messages: this.messagesFor(chatModel.service()) });
        request.setTimeoutPeriodInMs(this.timeoutMs());
        request.setRejectsOnFinalError(true); // a failed request rejects, so failover can follow
        await request.asyncSendAndStreamResponse();
        if (request.error()) {
            throw new Error(chatModel.modelName() + ": " + request.error().message);
        }
        const text = (request.fullContent() || "").trim();
        if (!text) {
            throw new Error(chatModel.modelName() + ": no answer");
        }
        return text;
    }

    messagesFor (service) {
        const image = this.imageParts();
        return [
            { role: "system", content: this.instruction() },
            { role: "user", content: service.visionUserContent(this.prompt(), image.mimeType, image.base64) }
        ];
    }

    /**
     * @description The data URL's type and bytes ("data:image/png;base64,…").
     * @returns {{mimeType: String, base64: String}}
     * @category Query
     */
    imageParts () {
        const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(this.dataUrl() || "");
        if (!match || !match[2]) {
            throw new Error("not a base64 image data URL");
        }
        return { mimeType: match[1], base64: match[3] };
    }

}.initThisClass());
