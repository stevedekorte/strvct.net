"use strict";

/**
 * @module library.services.ElevenLabs
 */

/**
 * @class SvElevenLabsTtsSettings
 * @extends SvTtsVendorSettings
 * @classdesc ElevenLabs speech settings for an SvTtsSession. ElevenLabs only
 * speaks lines whose voice ref names one of its voices (Plans/Multi-Voice
 * Narration M2), so it has a model but no narrator voice.
 */
(class SvElevenLabsTtsSettings extends SvTtsVendorSettings {

    static jsonSchemaDescription () {
        return "ElevenLabs speech settings for a text-to-speech session.";
    }

    initPrototypeSlots () {
        {
            /**
             * @member {string} modelId
             * @description The ElevenLabs speech model. Flash v2.5 is the live
             * narration choice; v3 is the most expressive and not real-time.
             */
            const slot = this.newSlot("modelId", "eleven_flash_v2_5");
            slot.setInspectorPath("");
            slot.setLabel("ElevenLabs model");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setValidValues(["eleven_flash_v2_5", "eleven_turbo_v2_5", "eleven_multilingual_v2", "eleven_v3"]);
            slot.setIsSubnodeField(true);
            slot.setSummaryFormat("{value}\n{key}");
        }
    }

    initPrototype () {
        this.setTitle("ElevenLabs");
    }

    serviceName () {
        return "elevenlabs";
    }

    /**
     * @description A speech request in an ElevenLabs voice.
     * @param {string} voiceId - an ElevenLabs voice id
     * @param {SvTtsSession} session
     * @returns {SvElevenLabsTtsRequest}
     * @category Requests
     */
    newRequestForVoice (voiceId, session) {
        const request = SvElevenLabsTtsRequest.clone();
        request.setDelegate(session);
        return request.setupForVoice(voiceId, session.prompt(), this.modelId());
    }

}.initThisClass());
