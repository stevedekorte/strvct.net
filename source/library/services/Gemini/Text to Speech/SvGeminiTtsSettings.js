"use strict";

/**
 * @module library.services.Gemini.Text_to_Speech
 */

/**
 * @class SvGeminiTtsSettings
 * @extends SvTtsVendorSettings
 * @classdesc Gemini speech settings for an SvTtsSession: model, narrator
 * voice and the delivery style every Gemini request carries.
 */
(class SvGeminiTtsSettings extends SvTtsVendorSettings {

    static jsonSchemaDescription () {
        return "Gemini speech settings for a text-to-speech session.";
    }

    initPrototypeSlots () {
        {
            /**
             * @member {string} model
             * @description The Gemini speech model, for the narrator and for any
             * character whose voice ref names a Gemini voice. The valid values
             * are read lazily: SvGeminiService loads after this class.
             */
            const slot = this.newSlot("model", "gemini-3.8-flash-tts");
            slot.setInspectorPath("");
            slot.setLabel("Gemini model");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValuesClosure(() => SvGeminiService.speechModelIds());
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("{value}\n{key}");
        }

        {
            /**
             * @member {string} voice
             * @description The narrator's Gemini voice. Schedar is Google's "even"
             * voice, chosen by ear from the 30 prebuilt voices (2026-09).
             */
            const slot = this.newSlot("voice", "Schedar");
            slot.setInspectorPath("");
            slot.setLabel("Gemini voice");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValuesClosure(() => SvGeminiService.speechVoiceNames());
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("{value}\n{key}");
        }

        {
            /**
             * @member {string} style
             * @description The delivery direction sent with every Gemini request
             * (speech_metadata.style; never read aloud).
             */
            const slot = this.newSlot("style", "Dungeon Master narration. Cinematic and vivid but easy to follow. Slightly slower than normal with short pauses after sentences and a longer pause before reveals. Vary intonation for tension and wonder; confident downward cadence on statements. Enunciate fantasy names. Clearly emphasize numbers, dice results, and status conditions. Use subtle, consistent NPC voices without going cartoonish. Read the text verbatim and completely: when text begins with a name followed by a colon (a list entry like 'Dirk: a tenth-level fighter'), SPEAK the name and continue — never treat it as a speaker label or stage direction to omit.");
            slot.setInspectorPath("");
            slot.setLabel("Gemini style");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
        }
    }

    initPrototype () {
        this.setTitle("Gemini");
    }

    serviceName () {
        return "gemini";
    }

    narratorVoiceId () {
        return this.voice();
    }

    /**
     * @description A Gemini speech request in voiceId, or the narrator voice.
     * The style rides along (Gemini speaks the text verbatim and never reads
     * the style aloud); speed has no Gemini equivalent.
     * @param {string|null} voiceId - a name from SvGeminiService.speechVoiceNames(), or null
     * @param {SvTtsSession} session
     * @returns {SvGeminiTtsRequest}
     * @category Requests
     */
    newRequestForVoice (voiceId, session) {
        const request = SvGeminiTtsRequest.clone();
        request.setDelegate(session);
        return request.setupForVoice({
            voiceName: voiceId || this.voice(),
            text: session.ttsSafeInput(),
            modelId: this.model(),
            style: this.style()
        });
    }

}.initThisClass());
