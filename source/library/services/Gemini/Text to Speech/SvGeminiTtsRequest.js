"use strict";

/**
 * @module library.services.Gemini.Text_to_Speech
 * @class SvGeminiTtsRequest
 * @extends SvOpenAiTtsRequest
 * @classdesc One Gemini speech request (gemini-3.8-flash-tts and
 * gemini-3.8-flash-lite-tts, via the Interactions API). Rides the same
 * session request queue, proxy transport and SvWaSound as the OpenAI and
 * ElevenLabs requests; what differs is the body shape and the response,
 * which is JSON carrying the audio as a base64 WAV (16-bit mono PCM, 24 kHz)
 * rather than the audio file itself.
 */
(class SvGeminiTtsRequest extends SvOpenAiTtsRequest {

    service () {
        return SvGeminiService.shared();
    }

    /**
     * @description Configures the request to speak text in a prebuilt voice.
     * The text is spoken verbatim; style (optional) is the delivery direction
     * — tone, pace, emotion — and is never read aloud.
     * @param {Object} options - { voiceName, text, modelId, style }
     * @returns {SvGeminiTtsRequest}
     * @category Configuration
     */
    setupForVoice (options) {
        this.setApiUrl(SvGeminiService.speechUrl());
        this.setBodyJson({
            model: options.modelId || SvGeminiService.defaultSpeechModelId(),
            input: [{ type: "user_input", content: [this.textContentJson(options.text, options.style)] }],
            response_format: { type: "audio" },
            generation_config: { speech_config: [{ voice: options.voiceName }] }
        });
        return this;
    }

    /**
     * @description The text block to speak, with the style attached as speech
     * metadata when there is one.
     * @param {string} text
     * @param {string} style
     * @returns {Object}
     * @category Configuration
     */
    textContentJson (text, style) {
        const json = { type: "text", text: text };
        if (style) {
            json.annotations = [{ type: "speech_metadata", style: style }];
        }
        return json;
    }

    /**
     * @description Unwraps the audio from the JSON response.
     * @param {Blob} responseBlob - the response body
     * @returns {Promise<Blob>}
     * @category Response Data
     */
    async audioBlobFromResponse (responseBlob) {
        const audio = this.audioContentIn(JSON.parse(await responseBlob.text()));
        if (!audio) {
            throw new Error("Gemini speech response has no audio");
        }
        return Blob.fromDataUrl("data:" + (audio.mime_type || "audio/wav") + ";base64," + audio.data);
    }

    /**
     * @description The first audio content block among the interaction's steps.
     * @param {Object} json - the interaction
     * @returns {Object|undefined} { type: "audio", data, mime_type }
     * @category Response Data
     */
    audioContentIn (json) {
        const contents = (json.steps || []).flatMap(step => step.content || []);
        return contents.find(content => content.type === "audio" && content.data);
    }

}.initThisClass());
