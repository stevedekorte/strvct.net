"use strict";

/**

    @class SvAiParsedResponseMessage_voiceNarration
    @extends SvAiParsedResponseMessage
    @description A class for voice narration of AI response messages.

    Sentences are spoken in groups: consecutive sentences by one speaker go
    out as one speech request (narrateSentence). A generative voice varies
    from request to request, so fewer, longer requests keep it steadier. The
    first request is a single sentence so speech starts quickly; each later
    one may hold one more, up to four. A group plays as one sound, and its
    sentences are highlighted in turn across it (onSpeakingText per
    sentence, as before).

*/

(class SvAiParsedResponseMessage_voiceNarration extends SvAiParsedResponseMessage {

    initPrototypeSlots_voiceNarration () {
        {
            const slot = this.newSlot("narrationGroup", null); // { speakerId, sentences }: waiting to go out as one request
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("narrationGroupCount", 0); // requests sent for this message
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("soundSentences", null); // Map sound -> its sentences, for highlighting
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("highlightedSentence", null); // the sentence being spoken now
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
    }

    // TODO: make a generic protocol for voice narration, without session and settings dependencies

    didUpdateIsDoneSpeaking (oldValue, newValue) {
        if (newValue) {
            //this.clearAnyQueuedAudio();
        }
    }

    tagsToSpeak () {
        return ["sentence"];
    }

    /**
     * @description Tags whose sentences are shown but never spoken (nor
     * caption-paced). The conversation decides — duck-typed
     * `unspokenTagNames()`, like `wantsCaptionPacing` — so this layer names
     * no app tags. Default: none.
     * @returns {Set<String>}
     * @category Voice Narration
     */
    tagsNotToSpeakInsideSet () {
        const conv = this.conversation();
        const names = (conv && typeof conv.unspokenTagNames === "function") ? conv.unspokenTagNames() : [];
        return new Set(names || []);
    }

    /**
     * @description Whether the conversation vetoes speaking this sentence —
     * duck-typed `shouldSpeakSentence(text, info)` with
     * `{ message, inTableTalk }`, so an app can silence a line that repeats
     * one already spoken this turn without this layer knowing the rule.
     * Default: speak.
     * @param {String} text
     * @param {SvStreamNode} streamNode
     * @returns {Boolean}
     * @category Voice Narration
     */
    isVetoedByConversation (text, streamNode) {
        const conv = this.conversation();
        if (!conv || typeof conv.shouldSpeakSentence !== "function") {
            return false;
        }
        const inTableTalk = !!streamNode.detectAncestor(node => !node.isTextNode() && node.name() === "table-talk");
        return conv.shouldSpeakSentence(text, { message: this, inTableTalk }) === false;
    }

    /**
     * @description Whether a speakable node sits inside an unspoken tag.
     * @param {SvStreamNode} streamNode
     * @returns {Boolean}
     * @category Voice Narration
     */
    isInsideUnspokenTag (streamNode) {
        const set = this.tagsNotToSpeakInsideSet();
        if (set.size === 0) {
            return false;
        }
        return !!streamNode.detectAncestor(node => !node.isTextNode() && set.has(node.name()));
    }

    // --- voice narration ---

    playTtsPauseMs (ms) {
        assert(Type.isNumber(ms));
        this.flushNarrationGroup(); // the sentences before the pause go first
        this.voiceNarrateText("<break time=\"" + ms + "ms\"/>");
    }

    shouldVoiceNarrate () {
        const controller = this.narrationController();
        if (!controller) { return false; }
        return !this.isDoneSpeaking() && controller.isEnabled();
    }

    stopSpeaking () {
        this.setIsDoneSpeaking(true);
        this.clearTimeoutNamed("narrationGroupFlush");
        this.setNarrationGroup(null); // not yet requested: never will be
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

    /**
     * @description The speaker of a speakable node, or null for the narrator
     * (Plans/Multi-Voice Narration). Nearest-first: the node's own `speaker`
     * attribute, else the nearest enclosing <quote>'s. The value is whatever
     * the markup carried (the app treats it as a character jsonId); this
     * layer never interprets it. Pure — no use of this — so it is testable
     * on a bare stream node.
     * @param {SvStreamNode} streamNode
     * @returns {String|null}
     * @category Voice Narration
     */
    speakerIdForStreamNode (streamNode) {
        const speakerOf = (node) => {
            const attrs = node.attributes ? node.attributes() : null;
            const id = attrs ? attrs.speaker : null;
            return (typeof id === "string" && id.trim().length) ? id.trim() : null;
        };
        const own = speakerOf(streamNode);
        if (own) {
            return own;
        }
        const quote = streamNode.detectAncestor(node => !node.isTextNode() && node.name() === "quote" && speakerOf(node));
        return quote ? speakerOf(quote) : null;
    }

    // --- sentence groups ---

    /**
     * @description Speaks a sentence, in a group with the sentences around
     * it by the same speaker: a change of speaker sends the group; so does a
     * full one, or a pause in the stream.
     * @param {String} text
     * @param {String|null} speakerId - null: the narrator
     * @returns {SvAiParsedResponseMessage}
     * @category Voice Narration
     */
    narrateSentence (text, speakerId = null) {
        const group = this.narrationGroup();
        if (group && group.speakerId !== speakerId) {
            this.flushNarrationGroup();
        }
        this.addToNarrationGroup(text, speakerId);
        if (this.narrationGroupIsFull()) {
            return this.flushNarrationGroup();
        }
        this.addTimeout(() => this.flushNarrationGroup(), this.narrationGroupWaitMs(), "narrationGroupFlush");
        return this;
    }

    addToNarrationGroup (text, speakerId) {
        if (!this.narrationGroup()) {
            this.setNarrationGroup({ speakerId: speakerId, sentences: [] });
        }
        this.narrationGroup().sentences.push(text);
        return this;
    }

    /**
     * @description Whether the waiting group should go now: the first
     * request is one sentence (speech starts quickly), each later one may
     * hold one more, up to four, within a length cap.
     * @returns {Boolean}
     * @category Voice Narration
     */
    narrationGroupIsFull () {
        const sentences = this.narrationGroup().sentences;
        const maxSentences = Math.min(this.narrationGroupCount() + 1, 4);
        return sentences.length >= maxSentences || sentences.join(" ").length >= 500;
    }

    /**
     * @description How long a part-filled group waits for the next sentence
     * before it goes anyway.
     * @returns {Number} milliseconds
     * @category Voice Narration
     */
    narrationGroupWaitMs () {
        return 800;
    }

    /**
     * @description Sends the waiting group, if any, as one speech request.
     * @returns {SvAiParsedResponseMessage}
     * @category Voice Narration
     */
    flushNarrationGroup () {
        this.clearTimeoutNamed("narrationGroupFlush");
        const group = this.narrationGroup();
        this.setNarrationGroup(null);
        if (group && this.shouldVoiceNarrate()) { // narration may have been turned off while it waited
            this.setNarrationGroupCount(this.narrationGroupCount() + 1);
            this.voiceNarrateSentences(group.sentences, group.speakerId);
        }
        return this;
    }

    /**
     * @description Queues sentences as one speech request, remembering them
     * so they can be highlighted in turn as the sound plays.
     * @param {Array<String>} sentences
     * @param {String|null} speakerId
     * @category Voice Narration
     */
    voiceNarrateSentences (sentences, speakerId) {
        const sound = this.voiceNarrateText(sentences.join(" "), speakerId);
        if (sound) {
            this.soundSentencesMap().set(sound, sentences);
        }
    }

    soundSentencesMap () {
        if (!this.soundSentences()) {
            this.setSoundSentences(new Map());
        }
        return this.soundSentences();
    }

    /**
     * @description Queues text for speech. speakerId (may be null = narrator)
     * rides along so the session can choose the voice; the sound and the
     * caption channel are unchanged.
     * @param {String} text
     * @param {String|null} speakerId
     * @returns {SvWaSound|null} the queued sound
     * @category Voice Narration
     */
    voiceNarrateText (text, speakerId = null) {
        const controller = this.narrationController();
        if (!controller) { return null; }
        const sound = controller.queueNarrationSegment(text, speakerId ? { speakerId: speakerId } : undefined);
        if (!sound) { return null; }
        // we want to follow when the sound starts/stops playing so we can
        // highlight/unhighlight the text in the chat view
        sound.addDelegate(this);
        sound.setTranscript(text); // so delegate callbacks know which text the audio is for
        return sound;
    }

    // --- highlighting a sound's sentences in turn ---

    onSoundStarted (sound) {
        const sentences = this.soundSentencesMap().get(sound) || [sound.transcript()];
        this.highlightSentence(sentences[0]);
        this.scheduleSentenceHighlights(sentences, 1000 * sound.duration() / (sound.playbackRate() || 1));
    }

    /**
     * @description Moves the highlight through a sound's later sentences,
     * each at its share of the sound by length — speech runs close to
     * evenly per character.
     * @param {Array<String>} sentences
     * @param {Number} durationMs - the sound's playing time
     * @category Voice Narration
     */
    scheduleSentenceHighlights (sentences, durationMs) {
        const total = sentences.reduce((sum, t) => sum + t.length, 0) || 1;
        let before = 0;
        sentences.forEach((text, i) => {
            if (i > 0) {
                this.addTimeout(() => this.highlightSentence(text), durationMs * before / total, "sentenceHighlight" + i);
            }
            before += text.length;
        });
    }

    highlightSentence (text) {
        this.unhighlightSentence();
        this.setHighlightedSentence(text);
        this.onSpeakingText(text);
    }

    unhighlightSentence () {
        const text = this.highlightedSentence();
        if (text !== null) {
            this.setHighlightedSentence(null);
            this.onSpokeText(text);
        }
    }

    onSoundEnded (sound) {
        const sentences = this.soundSentencesMap().get(sound) || [];
        sentences.forEach((text, i) => this.clearTimeoutNamed("sentenceHighlight" + i)); // a sound cut short
        this.soundSentencesMap().delete(sound);
        this.unhighlightSentence();
    }

    onSpeakingText (text) {
        this.postNoteNamed("onSpeakingText").setInfo(text); //.setIsDebugging(true);
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

