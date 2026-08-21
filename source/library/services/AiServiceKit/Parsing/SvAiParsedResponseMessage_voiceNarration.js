"use strict";

/**

    @class SvAiParsedResponseMessage_voiceNarration
    @extends SvAiParsedResponseMessage
    @description A class for voice narration of AI response messages.

*/

(class SvAiParsedResponseMessage_voiceNarration extends SvAiParsedResponseMessage {

    // TODO: make a generic protocol for voice narration, without session and settings dependencies

    didUpdateIsDoneSpeaking (oldValue, newValue) {
        if (newValue) {
            //this.clearAnyQueuedAudio();
        }
    }

    tagsToSpeak () {
        return ["sentence"];
    }

    // --- voice narration ---

    playTtsPauseMs (ms) {
        assert(Type.isNumber(ms));
        this.voiceNarrateText("<break time=\"" + ms + "ms\"/>");
    }

    shouldVoiceNarrate () {
        const controller = this.narrationController();
        if (!controller) { return false; }
        return !this.isDoneSpeaking() && controller.isEnabled();
    }

    stopSpeaking () {
        this.setIsDoneSpeaking(true);
        const controller = this.narrationController();
        if (controller) {
            controller.stopSpeaking();
        }
        return this;
    }

    session () {
        const conv = this.conversation();
        if (!conv) { return null; }
        return conv.firstOwnerChainNodeOfClass(UoSession);
    }

    /**
     * The conversation owns the narration controller (duck-typed:
     * isEnabled / queueNarrationSegment / stopSpeaking). Session chats
     * forward to their session's controller; assistant conversations carry
     * their own. Framework stays app-agnostic — no UoSession reference here.
     */
    narrationController () {
        const conv = this.conversation();
        if (!conv || typeof conv.narrationController !== "function") { return null; }
        return conv.narrationController();
    }

    /**
     * Whether the SILENT caption pacer may drive sentence highlighting when
     * voice is off (the theatre CC rides it). Opt-in per conversation —
     * without the gate, every assistant conversation highlighted text as if
     * narrating while producing no sound, which read as broken audio.
     */
    conversationWantsCaptionPacing () {
        const conv = this.conversation();
        return !!(conv && typeof conv.wantsCaptionPacing === "function" && conv.wantsCaptionPacing());
    }

    voiceNarrateText (text) {
        const controller = this.narrationController();
        if (!controller) { return; }
        const sound = controller.queueNarrationSegment(text);
        if (!sound) { return; }
        // we want to follow when the sound starts/stops playing so we can
        // highlight/unhighlight the text in the chat view
        sound.addDelegate(this);
        sound.setTranscript(text); // so delegate callbacks know which text the audio is for
    }

    onSoundStarted (sound) {
        //console.log(this.svType() + ".onSoundStarted [" + sound.transcript().clipWithEllipsis(15) + "]");
        this.onSpeakingText(sound.transcript());
    }

    onSpeakingText (text) {
        this.postNoteNamed("onSpeakingText").setInfo(text); //.setIsDebugging(true);
    }

    onSoundEnded (sound) {
        //console.log(this.svType() + ".onSoundEnded [" + sound.transcript().clipWithEllipsis(15) + "]");
        this.onSpokeText(sound.transcript());
    }

    onSpokeText (text) {
        this.postNoteNamed("onSpokeText").setInfo(text); //.setIsDebugging(true);
    }

    // --- caption pacing without audio ---
    // Captions show regardless of the voice setting (Plans/Edge Handles): the
    // theatre collapses the narration column, so the caption is the only text
    // channel there. When no sound rides a narration segment (voice disabled,
    // or a device that gets no TTS), the SAME onSpeakingText/onSpokeText
    // notifications are posted from this text pacer — per sentence, cleared
    // on a reading-time timeout — so caption consumers ride one channel
    // regardless of which clock drives it.

    /**
     * @description Queues a sentence for text-paced captioning; starts the
     * pacer if idle.
     * @param {String} text - the sentence to caption.
     * @returns {SvAiParsedResponseMessage}
     * @category Caption Pacing
     */
    paceCaptionText (text) {
        this.pacedCaptionQueue().push(text);
        if (!this._pacedCaptionActive) {
            this._pacedCaptionActive = true;
            // A beat before the first sentence: the pacer runs at parse time,
            // AHEAD of the tile sync that renders the sentence's div — give
            // the view a cycle so highlight/caption consumers find their
            // target (the TTS clock's audio latency provided this for free).
            this.addTimeout(() => {
                this.showNextPacedCaption();
            }, 150, "pacedCaptionStart");
        }
        return this;
    }

    pacedCaptionQueue () {
        if (!this._pacedCaptionQueue) {
            this._pacedCaptionQueue = []; // lazy: categories cannot add slots
        }
        return this._pacedCaptionQueue;
    }

    showNextPacedCaption () {
        const text = this.pacedCaptionQueue().shift();
        if (Type.isNullOrUndefined(text)) {
            this._pacedCaptionActive = false;
            return this;
        }
        this._pacedCaptionActive = true;
        this.onSpeakingText(text);
        this.addTimeout(() => {
            this.onSpokeText(text);
            this.showNextPacedCaption();
        }, this.readingTimeMsForText(text), "pacedCaption");
        return this;
    }

    /**
     * @description How long a paced caption holds: roughly a reading speed of
     * 250wpm with a floor so short lines still register.
     * @param {String} text
     * @returns {Number} milliseconds
     * @category Caption Pacing
     */
    readingTimeMsForText (text) {
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        return Math.max(1600, 400 + words * 240);
    }

    /*
    onSoundStarted (aNote) {
        const sound = aNote.sender();
        this.postNoteNamed("onSpeakingText").setInfo(sound.transcript());
    }

    onSoundEnded (aNote) {
        const sound = aNote.sender();
        this.postNoteNamed("onSpokeText").setInfo(sound.transcript());
    }

    spokenContentOfText (text) {
        return text.stripHtmlElementsWithTagNames(this.unspeakableTagNames());
    }
  */

}).initThisCategory();

