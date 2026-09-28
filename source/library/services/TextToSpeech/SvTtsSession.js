"use strict";

/**
 * @module library.services.TextToSpeech
 */

/**
 * @class SvTtsSession
 * @extends SvSummaryNode
 * @classdesc Speaks text through whichever speech vendor a line calls for.
 * One request queue and one audio queue serve every vendor, so a narration
 * can switch vendors per sentence (a Gemini narrator, a character in an
 * OpenAI or ElevenLabs voice) and still play in order. Each vendor's
 * settings live in their own SvTtsVendorSettings, which builds that vendor's
 * requests. Formerly SvOpenAiTtsSession (renamed 2026-09-28; see
 * legacySlotMoves()).
 */
(class SvTtsSession extends SvSummaryNode {

    static jsonSchemaDescription () {
        return "A text-to-speech session: speaks text through the chosen speech vendors, in order.";
    }

    /**
     * @description Where each setting stored on a pre-2026-09-28 session
     * (then SvOpenAiTtsSession, with every vendor's settings as flat slots)
     * now lives: [legacy slot, its type, vendor settings slot, setting]. The legacy
     * slots stay declared so those records load; adoptLegacySlotValues()
     * moves their values once. Remove them after every stored session has
     * been re-saved.
     * @returns {Array<Array<string>>}
     * @category Legacy
     */
    static legacySlotMoves () {
        return [
            ["ttsModel", "String", "openAiSettings", "model"],
            ["voice", "String", "openAiSettings", "voice"],
            ["responseFormat", "String", "openAiSettings", "responseFormat"],
            ["speed", "Number", "openAiSettings", "speed"],
            ["instructions", "String", "openAiSettings", "instructions"],
            ["elevenLabsModelId", "String", "elevenLabsSettings", "modelId"],
            ["geminiTtsModel", "String", "geminiSettings", "model"],
            ["geminiVoice", "String", "geminiSettings", "voice"]
        ];
    }

    initPrototypeSlots () {

        {
            /**
             * @member {string} prompt
             * @description The text to speak next.
             */
            const slot = this.newSlot("prompt", "");
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("");
        }

        {
            /**
             * @member {string} narratorService
             * @description Which vendor speaks the narrator's own lines (a line
             * attributed to a character with a voice of their own follows that
             * character's voice ref instead), in that vendor's narrator voice.
             * Gemini is the default (2026-09-23).
             */
            const slot = this.newSlot("narratorService", "gemini");
            slot.setInspectorPath("");
            slot.setLabel("Narrator service");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(["openai", "gemini"]);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("{value}\n{key}");
        }

        this.newVendorSettingsSlot("openAiSettings", "SvOpenAiTtsSettings");
        this.newVendorSettingsSlot("geminiSettings", "SvGeminiTtsSettings");
        this.newVendorSettingsSlot("elevenLabsSettings", "SvElevenLabsTtsSettings");

        this.thisClass().legacySlotMoves().forEach(move => this.newLegacySlot(move[0], move[1]));

        {
            /**
             * @member {null} generateAction
             * @description Speaks the prompt.
             */
            const slot = this.newSlot("generateAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Generate");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("generate");
        }

        {
            /**
             * @member {string} error
             * @description The last request error's message.
             */
            const slot = this.newSlot("error", ""); // null or String
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setCanEditInspection(false);
        }

        // --- playing ---

        {
            /**
             * @member {boolean} isMuted
             * @description Indicates if the audio is muted.
             */
            const slot = this.newSlot("isMuted", false);
            slot.setInspectorPath("");
            slot.setLabel("is muted");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("");
        }

        {
            /**
             * @member {Number} maxConcurrentRequests
             * @description Maximum concurrent speech requests in flight.
             */
            const slot = this.newSlot("maxConcurrentRequests", 3);
            slot.setSlotType("Number");
        }

        {
            /**
             * @member {Set} inFlightRequests
             * @description Speech requests currently in flight.
             */
            const slot = this.newSlot("inFlightRequests", null);
            slot.setSlotType("Set");
        }

        {
            /**
             * @member {Array} ttsRequestQueue
             * @description Speech requests waiting to be sent.
             */
            const slot = this.newSlot("ttsRequestQueue", null);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(false);
            slot.setSummaryFormat("");
            slot.setSlotType("Array");
        }

        {
            /**
             * @member {SvAudioQueue} audioQueue
             * @description Plays the sounds in the order they were requested.
             */
            const slot = this.newSlot("audioQueue", null);
            slot.setDuplicateOp("copyValue");
            slot.setShouldStoreSlot(false);
            slot.setIsSubnode(true);
            slot.setSlotType("SvAudioQueue");
            slot.setSummaryFormat("");
        }

        {
            /**
             * @member {string} status
             * @description Current status of the session.
             */
            const slot = this.newSlot("status", ""); // String
            slot.setInspectorPath("");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
            slot.setSummaryFormat("");
        }

        {
            /**
             * @member {SvWaSound} sound
             * @description Latest sound being generated.
             */
            const slot = this.newSlot("sound", null); // latest sound being generated
            slot.setSlotType("SvWaSound");
        }

        {
            /**
             * @member {Object} delegate
             * @description Delegate object for callbacks.
             */
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
        }
    }

    /**
     * @description Declares a stored slot holding one vendor's settings. The
     * class is named, not referenced: the vendors load after this class.
     * @param {string} slotName
     * @param {string} className - an SvTtsVendorSettings subclass
     * @category Initialization
     */
    newVendorSettingsSlot (slotName, className) {
        const slot = this.newSlot(slotName, null);
        slot.setFinalInitProto(className);
        slot.setInspectorPath("");
        slot.setShouldStoreSlot(true);
        slot.setSyncsToView(true);
        slot.setDuplicateOp("duplicate");
        slot.setSlotType(className);
        slot.setIsSubnodeField(true);
    }

    /**
     * @description Declares a legacy slot (see legacySlotMoves()): stored so
     * old records load, null once its value has moved, never shown.
     * @param {string} slotName
     * @param {string} slotType
     * @category Legacy
     */
    newLegacySlot (slotName, slotType) {
        const slot = this.newSlot(slotName, null);
        slot.setSlotType(slotType);
        slot.setAllowsNullValue(true);
        slot.setShouldStoreSlot(true);
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setSubnodeClasses([]);
        this.setNodeCanAddSubnode(false);
        this.setCanDelete(true);
        this.setNodeCanReorderSubnodes(false);
        this.setNodeSubtitleIsChildrenSummary(true);
        this.setTitle("Text to Speech Session");
        this.setNoteIsSubnodeCount(true);
    }

    init () {
        super.init();
        this.setTtsRequestQueue([]);
        this.setInFlightRequests(new Set());
        this.setAudioQueue(SvAudioQueue.clone());
        return this;
    }

    finalInit () {
        super.finalInit();
        this.adoptLegacySlotValues();
        return this;
    }

    // --- legacy ---

    /**
     * @description Moves every legacy slot's loaded value into its vendor
     * settings, then clears the legacy slot so it never moves again.
     * @category Legacy
     */
    adoptLegacySlotValues () {
        this.thisClass().legacySlotMoves().forEach(move => this.adoptLegacySlotValue(move[0], move[2], move[3]));
    }

    /**
     * @param {string} legacyName
     * @param {string} settingsName
     * @param {string} settingName
     * @category Legacy
     */
    adoptLegacySlotValue (legacyName, settingsName, settingName) {
        const legacySlot = this.thisPrototype().slotNamed(legacyName);
        const value = legacySlot.onInstanceGetValue(this);
        if (value === null || value === undefined) {
            return;
        }
        const settings = this.thisPrototype().slotNamed(settingsName).onInstanceGetValue(this);
        settings.thisPrototype().slotNamed(settingName).onInstanceSetValue(settings, value);
        legacySlot.onInstanceSetValue(this, null);
    }

    // --- muting ---

    /**
     * @description Sets the muted state of the audio queue.
     * @param {boolean} aBool - The muted state to set.
     * @returns {SvTtsSession} The current instance.
     */
    setIsMuted (aBool) {
        this.audioQueue().setIsMuted(aBool);
        return this;
    }

    /**
     * @description Gets the muted state of the audio queue.
     * @returns {boolean} The current muted state.
     */
    isMuted () {
        return this.audioQueue().isMuted();
    }

    // --- generate action ---

    canGenerate () {
        return this.prompt().length > 0;
    }

    generateActionInfo () {
        return {
            isEnabled: this.canGenerate(),
            isVisible: true
        };
    }

    // --- vendors ---

    /**
     * @description Every vendor's settings.
     * @returns {SvTtsVendorSettings[]}
     * @category Vendors
     */
    vendorSettings () {
        return [this.openAiSettings(), this.geminiSettings(), this.elevenLabsSettings()];
    }

    /**
     * @description The settings of the vendor named serviceName, or null.
     * @param {string} serviceName - e.g. "openai", "gemini", "elevenlabs"
     * @returns {SvTtsVendorSettings|null}
     * @category Vendors
     */
    vendorSettingsFor (serviceName) {
        return this.vendorSettings().find(settings => settings.serviceName() === serviceName) || null;
    }

    /**
     * @description The settings of the vendor that speaks the narrator.
     * @returns {SvTtsVendorSettings}
     * @category Vendors
     */
    narratorSettings () {
        return this.vendorSettingsFor(this.narratorService()) || this.openAiSettings();
    }

    // --- requests ---

    /**
     * @description The request input: the prompt with TTS hazards neutralized.
     * A leading proper-noun-plus-colon ("Dirk: a tenth-level fighter.") reads
     * as a dialogue speaker label, and TTS models (the LLM-based ones
     * especially) can DROP speaker labels as stage directions instead of
     * reading them. Rewrite a leading label's colon to an em dash so the name
     * is always spoken. Input-only: prompt() and the sound transcript (the
     * closed captions) keep the original text.
     * @returns {string}
     * @category Requests
     */
    ttsSafeInput () {
        return this.prompt().replace(/^(\s*)([A-Z][\w' .-]{0,40}):(\s)/, "$1$2 —$3");
    }

    /**
     * @description One speech request for a VOICE SPEC: null (the narrator),
     * an OpenAI voice name, or { service, voiceId } naming a vendor.
     * @param {null|string|Object} voiceSpec
     * @returns {SvOpenAiTtsRequest} (or a vendor subclass of it)
     * @category Requests
     */
    newRequestForVoiceSpec (voiceSpec) {
        const spec = this.vendorVoiceFor(voiceSpec);
        return spec.settings.newRequestForVoice(spec.voiceId, this);
    }

    /**
     * @description A voice spec resolved to { settings, voiceId }: the vendor
     * that speaks it and the voice (null = that vendor's narrator voice). A
     * spec naming no known vendor falls back to the narrator.
     * @param {null|string|Object} voiceSpec
     * @returns {Object}
     * @category Requests
     */
    vendorVoiceFor (voiceSpec) {
        if (Type.isString(voiceSpec)) {
            return { settings: this.openAiSettings(), voiceId: voiceSpec };
        }
        const settings = voiceSpec ? this.vendorSettingsFor(voiceSpec.service) : null;
        if (settings) {
            return { settings: settings, voiceId: voiceSpec.voiceId };
        }
        return { settings: this.narratorSettings(), voiceId: null };
    }

    /**
     * @description Speaks the prompt in voiceSpec (null = the narrator):
     * queues the request and its sound, in order.
     * @param {null|string|Object} voiceSpec
     * @returns {SvWaSound}
     * @category Requests
     */
    generate (voiceSpec = null) {
        const request = this.newRequestForVoiceSpec(voiceSpec);
        this.ttsRequestQueue().push(request);
        const sound = request.sound();
        sound.setTranscript(this.prompt());
        this.queueSound(sound);
        this.processRequestQueue();
        return sound;
    }

    /**
     * @description Sends queued requests up to the concurrency limit.
     * @category Requests
     */
    processRequestQueue () {
        while (
            this.inFlightRequests().size < this.maxConcurrentRequests() &&
            this.ttsRequestQueue().length > 0
        ) {
            const request = this.ttsRequestQueue().shift();
            this.inFlightRequests().add(request);
            request.asyncSend();
        }
    }

    /**
     * @description Queues a sound for playback.
     * @param {SvWaSound} sound
     * @returns {SvTtsSession}
     */
    queueSound (sound) {
        this.audioQueue().queueSvWaSound(sound);
        return this;
    }

    shutdown () {
        this.stopAndClearQueue();
        return this;
    }

    /**
     * @description Stops playback and clears the queues.
     */
    stopAndClearQueue () {
        this.ttsRequestQueue().forEach(r => r.shutdown());
        this.setTtsRequestQueue([]);

        this.inFlightRequests().forEach(r => r.shutdown());
        this.inFlightRequests().clear();

        this.audioQueue().stopAndClearQueue();
    }

    // --- request delegate ---

    onRequestBegin (/*request*/) {
    }

    async onRequestComplete (request) {
        this.setStatus("success");
        this.inFlightRequests().delete(request);
        this.processRequestQueue();
    }

    onRequestError (request, error) {
        const s = "ERROR: " + error.message;
        console.error(s);
        this.setError(error.message);
        this.setStatus(s);
        this.sendDelegateMessage("onTtsPromptError", [this]);
        this.inFlightRequests().delete(request);
        this.processRequestQueue();
    }

    // --- playing audio ----

    pause () {
        this.logDebug("pause()");
        this.audioQueue().pause();
    }

    resume () {
        this.logDebug("resume()");
        this.audioQueue().resume();
    }

}.initThisClass());
