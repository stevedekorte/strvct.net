"use strict";

/**
 * @class SvAiParsedResponseMessage_sharedNarration
 * @extends SvAiParsedResponseMessage
 * @classdesc Shared narration (Plans/Progressive Disclosure §6, M2): the
 * device that narrates a response hands each clip it speaks to its
 * conversation, and another device plays those clips as its own narration of
 * the same message — so the highlight, the Theatre caption and Progressive
 * Disclosure follow the same voice on every device.
 *
 * Narrating side: when the conversation shares clips (duck-typed
 * `sharesNarrationClips()`), each clip — its audio bytes, its sentences with
 * their start in the clip, its length — is offered in order, once its audio is
 * ready (`asyncShareNarrationClip(message, clip)`), and after the last one the
 * conversation hears that no more are coming (`asyncShareNarrationEnd`). A
 * sound placed in the narration (an effect) is offered in order with the
 * clips (`shareNarrationSound`).
 *
 * Playing side: `beginSharedNarration()` when the narrating device says the
 * message will be narrated (hidden is the default, as on the narrating
 * device), `playSharedClip(clip, blobPromise)` per clip, `endSharedNarration()`
 * when no more are coming. A clip plays through the conversation's narration
 * controller (`queueNarrationSound`), and its sentences are highlighted and
 * revealed by the same code the narrating device runs (onSoundStarted).
 *
 * How a clip travels, and where its audio is stored, is the conversation's
 * business; this layer only hands clips over and plays them.
 */

(class SvAiParsedResponseMessage_sharedNarration extends SvAiParsedResponseMessage {

    initPrototypeSlots_sharedNarration () {
        {
            const slot = this.newSlot("clipShareChain", null); // the clips offered so far, in order (a Promise)
            slot.setSlotType("Promise");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("sharedClipCount", 0); // clips offered to the conversation
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("hasSharedNarrationEnd", false); // the end has been offered (a stop, then the stream's end, offer it once)
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isAnnouncedAsNarrated", false); // the conversation told other devices this response is narrated, so they hold it for the voice
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("expectsSharedClips", false); // another device narrates this message and more of its clips may come
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("hasHeardSharedNarrationEnd", false); // the narrating device said no more clips are coming
            slot.setSlotType("Boolean");
        }
    }

    // --- narrating side ---

    /**
     * @description Whether this message's clips are offered to its
     * conversation (duck-typed `sharesNarrationClips()`).
     * @returns {Boolean}
     * @category Shared Narration
     */
    sharesNarrationClips () {
        const conv = this.conversation();
        return !!(conv && typeof conv.sharesNarrationClips === "function" && conv.sharesNarrationClips());
    }

    /**
     * @description Offers a clip once its audio is ready, after the clips
     * before it (each clip's sentences carry their start in the clip).
     * @param {SvWaSound} sound
     * @param {Array<Object>} sentences - [{ text, index }]
     * @param {String|null} speakerId
     * @category Shared Narration
     */
    shareNarrationClip (sound, sentences, speakerId) {
        if (!this.sharesNarrationClips()) {
            return this;
        }
        const clipIndex = this.sharedClipCount();
        this.setSharedClipCount(clipIndex + 1);
        return this.chainClipShare(async () => {
            const clip = await this.asyncClipFromSound(sound, sentences);
            if (clip) {
                clip.clipIndex = clipIndex;
                clip.speakerId = speakerId;
                await this.conversation().asyncShareNarrationClip(this, clip);
            }
        });
    }

    /**
     * @description Offers a sound placed in this response's narration — an
     * effect beside its sentence — in order with the clips: the sentences
     * before it are sent first, and it is offered after the clips before it
     * (`asyncShareNarrationSound(message, soundInfo)`), so another device
     * queues it between the same two clips. What the sound is, the
     * conversation's caller says.
     * @param {Object} soundInfo - what another device needs to make the sound
     * @category Shared Narration
     */
    shareNarrationSound (soundInfo) {
        if (!this.sharesNarrationClips()) {
            return this;
        }
        this.flushNarrationGroup();
        const placed = Object.assign({ afterClipCount: this.sharedClipCount() }, soundInfo);
        return this.chainClipShare(() => this.conversation().asyncShareNarrationSound(this, placed));
    }

    /**
     * @description After the last clip has been offered — the stream ended,
     * or narration stopped — tells the conversation no more are coming
     * (once). Sent even when no clip was, if the response was announced as
     * narrated when it began (isAnnouncedAsNarrated, set by the conversation
     * as it announces it): the players hold its text — and every response
     * after it — until they hear this. A response with nothing to speak (a tool call, a no-op)
     * once never sent it, and held the table's text until the stall timer.
     * @category Shared Narration
     */
    shareNarrationEnd () {
        if (this.hasSharedNarrationEnd() || (this.sharedClipCount() === 0 && !this.isAnnouncedAsNarrated())) {
            return this;
        }
        this.setHasSharedNarrationEnd(true);
        const count = this.sharedClipCount();
        return this.chainClipShare(() => this.conversation().asyncShareNarrationEnd(this, count));
    }

    chainClipShare (fn) {
        const before = this.clipShareChain() || Promise.resolve();
        this.setClipShareChain(before.then(fn).catch(e => console.warn(this.svTypeId() + " sharing narration failed:", e && e.message)));
        return this;
    }

    /**
     * @description A clip once its audio has arrived (and decoded, where
     * this device has audio): null when it never did (the request failed,
     * or narration stopped). A device without audio cannot know the clip's
     * length — 0 — and a listener times the sentences by its own decode.
     * @param {SvWaSound} sound
     * @param {Array<Object>} sentences
     * @returns {Promise<Object|null>} { bytes, durationMs, sentences: [{ index, text, startMs }] }
     * @category Shared Narration
     */
    async asyncClipFromSound (sound, sentences) {
        await sound.fetchPromise();
        await sound.promiseToDecode();
        if (!sound.hasData() || (SvWaContext.hasAudio() && !sound.hasDecoded())) {
            return null;
        }
        const durationMs = Math.round(1000 * sound.duration());
        return { bytes: sound.data(), durationMs: durationMs, sentences: this.sentencesWithStarts(sentences, durationMs) };
    }

    // --- playing side ---

    /**
     * @description Another device narrates this message: if this device
     * would narrate it, its clips are expected, and the response is shown
     * only as it is spoken (hidden until the first clip starts).
     * @category Shared Narration
     */
    beginSharedNarration () {
        if (!this.shouldVoiceNarrate()) {
            return this;
        }
        this.setExpectsSharedClips(true);
        this.beginDisclosureIfWanted();
        this.noteNarrationQueued(); // the wait for the first clip is watched
        return this;
    }

    /**
     * @description Plays a clip of another device's narration of this
     * message, after the clips already queued; its sentences are highlighted
     * and revealed as it plays.
     * @param {Object} clip - { sentences: [{ index, text, startMs }], durationMs }
     * @param {Promise<Blob|null>} blobPromise - the clip's audio
     * @returns {SvWaSound|null}
     * @category Shared Narration
     */
    playSharedClip (clip, blobPromise) {
        const controller = this.narrationController();
        if (!this.expectsSharedClips() || !this.shouldVoiceNarrate() || !controller || typeof controller.queueNarrationSound !== "function") {
            return null;
        }
        const sound = this.newSharedClipSound(clip, blobPromise);
        this.soundSentencesMap().set(sound, clip.sentences);
        sound.addDelegate(this);
        controller.queueNarrationSound(sound);
        this.noteNarrationQueued();
        return sound;
    }

    /**
     * @description A sound for a clip, queued before its audio arrives (so
     * clips keep their order) and filled when it does.
     * @param {Object} clip
     * @param {Promise<Blob|null>} blobPromise
     * @returns {SvWaSound}
     * @category Shared Narration
     */
    newSharedClipSound (clip, blobPromise) {
        const sound = SvWaSound.clone();
        sound.setTranscript(this.transcriptOf(clip.sentences));
        sound.setFetchPromise(this.asyncFillSharedClipSound(sound, blobPromise));
        return sound;
    }

    async asyncFillSharedClipSound (sound, blobPromise) {
        try {
            const blob = await blobPromise;
            if (blob) {
                await sound.asyncLoadFromDataBlob(blob);
                return;
            }
        } catch (e) {
            console.warn(this.svTypeId() + " shared clip fetch failed:", e && e.message);
        }
        this.dropSharedClipSound(sound); // never plays: the queue moves past it, and so does disclosure
    }

    dropSharedClipSound (sound) {
        this.soundSentencesMap().delete(sound);
        this.finishDisclosureIfNarrationDone();
        return this;
    }

    /**
     * @description No more clips are coming: once the ones queued have been
     * heard, everything shows.
     * @category Shared Narration
     */
    endSharedNarration () {
        this.setExpectsSharedClips(false);
        this.setHasHeardSharedNarrationEnd(true);
        this.finishDisclosureIfNarrationDone();
        return this;
    }

    // --- hand-over to another message with the same id ---

    /**
     * @description Takes over another message's narration of the same
     * response — a stand-in replaced by the saved message — so playback,
     * the highlight and disclosure continue rather than restart (or flash
     * the whole text). The other message is left silent and showing nothing
     * held back.
     * @param {SvAiParsedResponseMessage} other
     * @category Shared Narration
     */
    adoptNarrationFrom (other) {
        if (!other || other === this || !other.soundSentences) {
            return this;
        }
        this.adoptNarrationSounds(other);
        this.setExpectsSharedClips(other.expectsSharedClips());
        this.setHasHeardSharedNarrationEnd(other.hasHeardSharedNarrationEnd());
        this.adoptDisclosureFrom(other);
        this.adoptPlayingClip(other);
        other.releaseNarration();
        return this;
    }

    adoptNarrationSounds (other) {
        other.soundSentencesMap().forEach((sentences, sound) => {
            sound.removeDelegate(other);
            sound.addDelegate(this);
            this.soundSentencesMap().set(sound, sentences);
        });
        return this;
    }

    adoptDisclosureFrom (other) {
        if (!other.isDisclosing()) {
            return this;
        }
        this.setDisclosedThrough(other.disclosedThrough());
        this.setDisclosureProgressAt(other.disclosureProgressAt());
        this.setIsDisclosing(true);
        this.armDisclosureStallTimer();
        this.tellConversationDisclosureChanged();
        return this;
    }

    /**
     * @description Continues the highlight through the rest of the clip
     * playing now, from where it has got to.
     * @param {SvAiParsedResponseMessage} other
     * @category Shared Narration
     */
    adoptPlayingClip (other) {
        const clip = other.playingClip();
        const sentence = other.highlightedSentence();
        if (!clip) {
            return this;
        }
        this.setPlayingClip(clip);
        if (sentence) {
            this.highlightSentence(sentence);
        }
        this.scheduleSentenceHighlights(clip.sentences, clip.durationMs, Date.now() - clip.startedAt);
        return this;
    }

    /**
     * @description Lets go of a narration another message took over: no
     * timers, no sounds, nothing held back, and no stop sent to the speaker.
     * @category Shared Narration
     */
    releaseNarration () {
        this.clearSentenceHighlightTimers();
        this.clearTimeoutNamed("disclosureStall");
        this.soundSentencesMap().clear();
        this.setPlayingClip(null);
        this.setHighlightedSentence(null);
        this.setExpectsSharedClips(false);
        if (this.isDisclosing()) {
            this.setIsDisclosing(false);
            this.tellConversationDisclosureChanged();
        }
        return this;
    }

}).initThisCategory();
