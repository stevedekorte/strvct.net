"use strict";

/**
 * @module library.services.Minimax
 * @class SvMinimaxService
 * @extends SvAiService
 * @classdesc MiniMax (Music 3, Speech, Hailuo). Game code should ask this
 * service for a music prompt via newMusicPrompt(), then talk to the
 * SvMusicPrompt interface.
 */

(class SvMinimaxService extends SvAiService {

    static initClass () {
        this.setIsSingleton(true);
        this.newClassSlot("apiHost", "https://api.minimax.io");
    }

    serviceInfo () {
        return {
            "musicGenerationEndpoint": this.musicGenerationUrl()
        };
    }

    modelsJson () {
        return [
            {
                "name": "music-3.0",
                "title": "MiniMax Music 3.0",
                "inputTokenLimit": 4000,
                "outputTokenLimit": 4000,
                "supportsMusicGeneration": true
            },
            {
                "name": "music-3.0-free",
                "title": "MiniMax Music 3.0 Free",
                "inputTokenLimit": 4000,
                "outputTokenLimit": 4000,
                "supportsMusicGeneration": true
            },
            {
                "name": "music-2.6",
                "title": "MiniMax Music 2.6",
                "inputTokenLimit": 4000,
                "outputTokenLimit": 4000,
                "supportsMusicGeneration": true
            }
        ];
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("musicPrompts", null);
            slot.setFinalInitProto(SvMinimaxMusicPrompts);
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    finalInit () {
        super.finalInit();
        this.setTitle("MiniMax");
    }

    musicGenerationUrl () {
        return this.thisClass().apiHost() + "/v1/music_generation";
    }

    lyricsGenerationUrl () {
        return this.thisClass().apiHost() + "/v1/lyrics_generation";
    }

    newMusicPrompt () {
        return this.musicPrompts().addPrompt();
    }

    validateKey (s) {
        return typeof s === "string" && s.length > 16;
    }

}.initThisClass());
