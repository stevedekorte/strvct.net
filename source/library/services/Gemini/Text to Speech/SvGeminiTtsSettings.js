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
             * @description The narrator's Gemini voice. en-gb-tutor-9 is a
             * Winchester English library voice, chosen by ear with the style
             * default (2026-09-28). It replaced Schedar; sessions stored with
             * Schedar keep it.
             */
            const slot = this.newSlot("voice", "en-gb-tutor-9");
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
             * (speech_metadata.style; never read aloud). Google advises a short
             * style: the long OpenAI-era prompt full of stage directions made the
             * narrator theatrical. Chosen by ear (2026-09-28).
             */
            const slot = this.newSlot("style", "A relaxed storyteller reading aloud to friends at the table: warm, unhurried, even energy. Gentle emphasis, clear on names and numbers. Understated, never theatrical.");
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
     * the style aloud): the request's own direction when it has one (a
     * speaker's voice description), otherwise this setting's style, which is
     * written for the narrator. Speed has no Gemini equivalent.
     * @param {string|null} voiceId - any id the speech endpoint accepts (a studio name or a library id), or null
     * @param {SvTtsSession} session
     * @param {string|null} [style] - this request's own direction, or null
     * @returns {SvGeminiTtsRequest}
     * @category Requests
     */
    newRequestForVoice (voiceId, session, style = null) {
        const request = SvGeminiTtsRequest.clone();
        request.setDelegate(session);
        return request.setupForVoice({
            voiceName: voiceId || this.voice(),
            text: session.ttsSafeInput(),
            modelId: this.model(),
            style: style || this.style()
        });
    }

}.initThisClass());
