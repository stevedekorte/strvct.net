"use strict";

/**
 * @module library.services.OpenAI.Text_to_Speech
 */

/**
 * @class SvOpenAiTtsSettings
 * @extends SvTtsVendorSettings
 * @classdesc OpenAI speech settings for an SvTtsSession (tts-1-hd, tts-1,
 * gpt-4o-mini-tts): model, narrator voice, format, speed and the
 * instructions gpt-4o-mini-tts takes.
 */
(class SvOpenAiTtsSettings extends SvTtsVendorSettings {

    static jsonSchemaDescription () {
        return "OpenAI speech settings for a text-to-speech session.";
    }

    /**
     * @description The voices the speech endpoint accepts (2026). The stored
     * `voice` slot picks the narrator from this list; a per-request voice
     * (a character's voice ref) must also come from it.
     * @returns {string[]}
     * @category Voices
     */
    static validVoiceNames () {
        return ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"];
    }

    /**
     * @description The playback speeds the endpoint accepts that we offer.
     * @returns {number[]}
     * @category Requests
     */
    static speedOptions () {
        return [1, 1.05, 1.10, 1.15, 1.2, 1.25, 1.5, 1.75, 2];
    }

    initPrototypeSlots () {
        {
            const validModels = ["tts-1-hd", "tts-1", "gpt-4o-mini-tts"]; // tts-1 is better than the newer gpt-4o-mini-tts!
            /**
             * @member {string} model
             * @description The OpenAI speech model.
             */
            const slot = this.newSlot("model", validModels.first());
            slot.setInspectorPath("");
            slot.setLabel("Text to Speech Model");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(validModels);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("");
        }

        {
            /**
             * @member {string} voice
             * @description The narrator's OpenAI voice.
             */
            const slot = this.newSlot("voice", "fable");
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(SvOpenAiTtsSettings.validVoiceNames());
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("{value}\n{key}");
        }

        {
            const validResponseFormats = ["mp3", "opus", "aac", "flac"];
            /**
             * @member {string} responseFormat
             * @description The audio format of the response.
             */
            const slot = this.newSlot("responseFormat", validResponseFormats.first());
            slot.setInspectorPath("");
            slot.setLabel("format");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(validResponseFormats);
            slot.setIsSubnodeField(true);
        }

        {
            /**
             * @member {number} speed
             * @description The playback speed the audio is generated at.
             */
            const slot = this.newSlot("speed", SvOpenAiTtsSettings.speedOptions().first());
            slot.setInspectorPath("");
            slot.setLabel("speed");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("{value}\n{key}");
            slot.setValidValues(SvOpenAiTtsSettings.speedOptions());
        }

        {
            /**
             * @member {string} instructions
             * @description Delivery instructions; only gpt-4o-mini-tts takes them.
             */
            const slot = this.newSlot("instructions", "Dungeon Master narration. Cinematic and vivid but easy to follow. Slightly slower than normal with short pauses after sentences and a longer pause before reveals. Vary intonation for tension and wonder; confident downward cadence on statements. Enunciate fantasy names. Clearly emphasize numbers, dice results, and status conditions. Use subtle, consistent NPC voices without going cartoonish. Read the text verbatim and completely: when text begins with a name followed by a colon (a list entry like 'Dirk: a tenth-level fighter'), SPEAK the name and continue — never treat it as a speaker label or stage direction to omit.");
            slot.setInspectorPath("");
            slot.setLabel("instructions");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
        }
    }

    initPrototype () {
        this.setTitle("OpenAI");
    }

    serviceName () {
        return "openai";
    }

    narratorVoiceId () {
        return this.voice();
    }

    /**
     * @description The endpoint speech requests post to.
     * @returns {string}
     * @category Requests
     */
    endpoint () {
        return "https://api.openai.com/v1/audio/speech";
    }

    /**
     * @description A speech request in voiceId, or the narrator voice.
     * @param {string|null} voiceId - a name from validVoiceNames(), or null
     * @param {SvTtsSession} session
     * @returns {SvOpenAiTtsRequest}
     * @category Requests
     */
    newRequestForVoice (voiceId, session) {
        const request = SvOpenAiTtsRequest.clone();
        request.setApiUrl(this.endpoint());
        request.setDelegate(session);
        request.setBodyJson(this.bodyJsonFor(voiceId || this.voice(), session.ttsSafeInput()));
        return request;
    }

    /**
     * @description The request body. Instructions ride only on the model
     * that takes them.
     * @param {string} voiceId
     * @param {string} text
     * @returns {Object}
     * @category Requests
     */
    bodyJsonFor (voiceId, text) {
        const json = { model: this.model(), voice: voiceId, input: text, response_format: this.responseFormat(), speed: this.speed() };
        if (this.model() === "gpt-4o-mini-tts" && this.instructions().length > 0) {
            json.instructions = this.instructions();
        }
        return json;
    }

}.initThisClass());
