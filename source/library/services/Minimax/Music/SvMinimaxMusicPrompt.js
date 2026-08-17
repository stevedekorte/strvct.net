"use strict";

/**
 * @module library.services.Minimax.Music
 * @class SvMinimaxMusicPrompt
 * @extends SvMusicPrompt
 * @classdesc MiniMax Music 3 via the official music_generation API.
 *
 * Game code should keep using the SvMusicPrompt interface. This subclass
 * only knows MiniMax request/response shape.
 */

(class SvMinimaxMusicPrompt extends SvMusicPrompt {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("sampleRate", 44100);
            slot.setSlotType("Number");
            slot.setLabel("Sample Rate");
            slot.setShouldStoreSlot(true);
            slot.setValidValues([16000, 24000, 32000, 44100]);
            slot.setIsSubnodeField(true);
        }
        {
            const slot = this.newSlot("bitrate", 256000);
            slot.setSlotType("Number");
            slot.setLabel("Bitrate");
            slot.setShouldStoreSlot(true);
            slot.setValidValues([32000, 64000, 128000, 256000]);
            slot.setIsSubnodeField(true);
        }
        {
            const slot = this.newSlot("audioFormat", "mp3");
            slot.setSlotType("String");
            slot.setLabel("Format");
            slot.setShouldStoreSlot(true);
            slot.setValidValues(["mp3", "wav", "pcm"]);
            slot.setIsSubnodeField(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
    }

    finalInit () {
        super.finalInit();
        if (!this.model()) {
            this.setModel("music-3.0");
        }
    }

    service () {
        return SvMinimaxService.shared();
    }

    generateEndpoint () {
        return this.service().musicGenerationUrl();
    }

    async asyncComposeRequestBody () {
        const body = {
            model: this.model(),
            prompt: this.prompt().trim(),
            is_instrumental: this.isInstrumental(),
            lyrics_optimizer: this.lyricsOptimizer(),
            output_format: "url",
            audio_setting: {
                sample_rate: this.sampleRate(),
                bitrate: this.bitrate(),
                format: this.audioFormat()
            }
        };
        if (!this.isInstrumental() && this.lyrics().trim()) {
            body.lyrics = this.lyrics();
        }
        return body;
    }

    applyGenerationResponse (json) {
        const code = json.base_resp && json.base_resp.status_code;
        if (code !== 0 && code !== undefined) {
            const msg = (json.base_resp && json.base_resp.status_msg) || ("MiniMax error " + code);
            throw new Error(msg);
        }
        const audio = json.data && json.data.audio;
        if (!audio) {
            throw new Error("MiniMax returned no audio");
        }
        this.setResultAudioUrl(audio);
        const extra = json.extra_info || {};
        if (extra.music_duration) {
            this.setResultDuration(extra.music_duration / 1000);
        }
        return this;
    }

}.initThisClass());
