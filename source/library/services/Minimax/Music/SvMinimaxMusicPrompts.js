"use strict";

/**
 * @module library.services.Minimax.Music
 * @class SvMinimaxMusicPrompts
 * @extends SvMusicPrompts
 */

(class SvMinimaxMusicPrompts extends SvMusicPrompts {

    promptClass () {
        return SvMinimaxMusicPrompt;
    }

}.initThisClass());
