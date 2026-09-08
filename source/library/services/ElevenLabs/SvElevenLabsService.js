"use strict";

/**
 * @module library.services.ElevenLabs
 * @class SvElevenLabsService
 * @extends SvAiService
 * @classdesc ElevenLabs as a client-side service: text to speech only (no chat
 * models). Exists so speech requests can authenticate to the proxy under this
 * vendor's name, exactly as SvOpenAiService does for OpenAI speech
 * (Plans/Multi-Voice Narration M2). The vendor key lives on the proxy; the
 * client sends the user's bearer token.
 */
(class SvElevenLabsService extends SvAiService {

    static initClass () {
        this.setIsSingleton(true);
    }

    serviceInfo () {
        return {};
    }

    modelsJson () {
        return []; // speech only — see SvElevenLabsTtsRequest for the speech models
    }

    /**
     * @description The speech models the vendor offers, best-first for live
     * narration. Flash v2.5 is the per-sentence choice (~75 ms first audio);
     * v3 is the most expressive and not real-time.
     * @returns {string[]}
     * @category Speech
     */
    static speechModelIds () {
        return ["eleven_flash_v2_5", "eleven_turbo_v2_5", "eleven_multilingual_v2", "eleven_v3"];
    }

    static defaultSpeechModelId () {
        return "eleven_flash_v2_5";
    }

    /**
     * @description The speech endpoint for a voice.
     * @param {string} voiceId - the vendor's voice id
     * @returns {string}
     * @category Speech
     */
    static speechUrlForVoiceId (voiceId) {
        return "https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(voiceId) + "?output_format=mp3_44100_128";
    }

    finalInit () {
        super.finalInit();
        this.setTitle("ElevenLabs");
        this.setSubtitle("text to speech");
        return this;
    }

}.initThisClass());
