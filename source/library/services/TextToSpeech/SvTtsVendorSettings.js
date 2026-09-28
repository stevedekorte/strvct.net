"use strict";

/**
 * @module library.services.TextToSpeech
 */

/**
 * @class SvTtsVendorSettings
 * @extends SvSummaryNode
 * @classdesc One speech vendor's settings inside an SvTtsSession: its model,
 * its narrator voice and whatever else that vendor's requests need. Each
 * vendor subclass builds its own requests, so the session never branches on
 * the vendor. Abstract.
 */
(class SvTtsVendorSettings extends SvSummaryNode {

    static jsonSchemaDescription () {
        return "One speech vendor's settings for a text-to-speech session.";
    }

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setNodeCanAddSubnode(false);
        this.setNodeCanReorderSubnodes(false);
        this.setCanDelete(false);
        this.setNodeSubtitleIsChildrenSummary(true);
    }

    /**
     * @description The vendor's name in a voice spec ({ service, voiceId })
     * and in SvTtsSession.narratorService.
     * @returns {string}
     * @category Identity
     */
    serviceName () {
        throw new Error(this.svType() + " must implement serviceName()");
    }

    /**
     * @description The voice the narrator speaks in when this vendor is the
     * narrator's, or null when the vendor offers no narrator voice.
     * @returns {string|null}
     * @category Voices
     */
    narratorVoiceId () {
        return null;
    }

    /**
     * @description One speech request for the session's current prompt, in
     * voiceId (or this vendor's narrator voice when voiceId is null). The
     * session is the request's delegate.
     * @param {string|null} voiceId
     * @param {SvTtsSession} session
     * @returns {SvOpenAiTtsRequest} (or a vendor subclass of it)
     * @category Requests
     */
    newRequestForVoice (/*voiceId, session*/) {
        throw new Error(this.svType() + " must implement newRequestForVoice()");
    }

}.initThisClass());
