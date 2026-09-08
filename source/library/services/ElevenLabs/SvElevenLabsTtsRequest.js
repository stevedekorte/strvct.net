"use strict";

/**
 * @module library.services.ElevenLabs
 * @class SvElevenLabsTtsRequest
 * @extends SvOpenAiTtsRequest
 * @classdesc One ElevenLabs speech request. The transport, the proxy hop, the
 * audio-blob checks and the SvWaSound plumbing are the OpenAI request's; only
 * the vendor differs: the voice rides the URL path, the body is
 * { text, model_id }, and the bearer token is looked up under this vendor.
 *
 * Lives in the same request queue and the same audio queue as OpenAI
 * requests, so a narration can alternate vendors sentence by sentence and
 * still play in order (Plans/Multi-Voice Narration M2).
 */
(class SvElevenLabsTtsRequest extends SvOpenAiTtsRequest {

    service () {
        return SvElevenLabsService.shared();
    }

    /**
     * @description Points this request at a voice and sets its body.
     * @param {string} voiceId - the vendor voice id
     * @param {string} text - what to say
     * @param {string} modelId - one of SvElevenLabsService.speechModelIds()
     * @returns {SvElevenLabsTtsRequest}
     * @category Setup
     */
    setupForVoice (voiceId, text, modelId) {
        this.setApiUrl(SvElevenLabsService.speechUrlForVoiceId(voiceId));
        this.setBodyJson({
            text: text,
            model_id: modelId || SvElevenLabsService.defaultSpeechModelId()
        });
        return this;
    }

}.initThisClass());
