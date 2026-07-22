"use strict";

/** * @module library.node.audio
 */

/** * @class SvAudioQueue
 * @extends SvSummaryNode
 * @implements {SvAudioClipDelegateProtocol}
 * @classdesc Manages a queue of audio clips.
 *
 * Example use:
 * In cases such as text-to-speech of sentences from a streaming LLM,
 * we need to queue the speech audio clips as they come in, and play them in order.
 *
 * The audio clips must implement the SvAudioClipProtocol protocol and
 * are expected to call the AudioClipDelegate methods as appropriate.
 *
 * Audio clips must implement this protocol:
 * - play()
 * - addDelegate(delegate)
 * - removeDelegate(delegate)
 * - stop()


 */

(class SvAudioQueue extends SvSummaryNode {

    /**
   * @category Initialization
   * @description Initializes the prototype slots for the audio queue.
   */
    initPrototypeSlots () {
    /**
     * @member {boolean} isMuted - Whether the audio queue is muted.
     */
        {
            const slot = this.newSlot("isMuted", false);
            slot.setSlotType("Boolean");
        }

        /**
     * @member {Object} currentSound - The current sound.
     */
        {
            const slot = this.newSlot("currentSound", null);
            slot.setSlotType("Object");
        }

        /**
     * @member {Array} queue - The queue of sounds.
     */
        {
            const slot = this.newSlot("queue", null); // FIFO (first in first out) queue
            slot.setSlotType("Array");
        }

        /**
     * @member {boolean} isPaused - Transport pause: processQueue holds while
     * true. Unlike isMuted (which DROPS sounds), pausing retains everything —
     * queued sounds wait, and the interrupted sound is re-queued to replay
     * from its start on resume.
     */
        {
            const slot = this.newSlot("isPaused", false);
            slot.setSlotType("Boolean");
        }

        /**
     * @member {Array} playedSounds - Bounded history of sounds that finished
     * playing (oldest first), retained so the transport can skip backward —
     * a played SvWaSound replays cleanly (play() builds a fresh audio source
     * per playback). See maxPlayedSoundsCount.
     */
        {
            const slot = this.newSlot("playedSounds", null);
            slot.setSlotType("Array");
        }

        this.setNodeSubtitleIsChildrenSummary(true);
        this.setShouldStoreSubnodes(false);
    }

    /**
   * @category Initialization
   * @description Initializes the prototype by adding required protocols.
   */
    initPrototype () {
    /*
    const slot = this.slotNamed("shortName")
    slot.setValidValues(this.validShortNames())
    */
        this.addProtocol(SvAudioClipDelegateProtocol);
    }


    /**
   * @category Initialization
   * @description Initializes the audio queue.
   */
    init () {
        super.init();
        this.setTitle("Audio Queue");
        this.setQueue([]);
        this.setPlayedSounds([]);
    }

    /**
   * @category Initialization
   * @description Performs final initialization steps.
   */
    finalInit () {
        super.finalInit();
        this.setCanDelete(true);
    }

    /**
   * @description Returns the subtitle of the audio queue.
   * @returns {string} The subtitle.
   * @category Information
   */
    subtitle () {
        const lines = [];
        const isPlaying = this.currentSound() !== null;

        if (isPlaying) {
            lines.push("playing");
        }

        if (this.queueSize()) {
            lines.push(this.queueSize() + " clips queued");
        }

        if (this.isMuted()) {
            lines.push("muted");
        }

        return lines.join("\n");
    }

    /**
   * @description Returns the size of the queue.
   * @returns {number} The size of the queue.
   * @category Information
   */
    queueSize () {
        return this.queue().length;
    }

    // ---

    /**
   * @category Mutation
   * @description Sets the muted state of the audio queue.
   * @param {boolean} aBool - The muted state.
   */
    setIsMuted (aBool) {
        this._isMuted = aBool;
        if (aBool) {
            this.pause();
        } else {
            this.resume();
        }
        return this;
    }

    // -----------------------------------

    /**
   * @category Queue Management
   * @description Queues an audio blob.
   * @param {Blob} audioBlob - The audio blob.
   * @returns {SvWaSound} The sound.
   */
    queueAudioBlob (audioBlob) {
        audioBlob.assertConformsToProtocol("SvAudioClipProtocol");
        const sound = SvWaSound.fromBlob(audioBlob);
        this.queueSvWaSound(sound);
        return sound;
    }

    /**
   * @category Queue Management
   * @description Queues a SvWaSound.
   * @param {SvWaSound} sound - The SvWaSound.
   */
    queueSvWaSound (sound) {
    // e.g. sound could be a SvWaSound or YouTube SvMusicTrack
    // just needs to support the protocol

        // verify sound protocol
        assert(sound.play);
        assert(sound.stop);
        assert(sound.addDelegate);
        assert(sound.removeDelegate);

        //console.log(this.svType() + " PUSH " + sound.description());
        this.queue().push(sound);
        this.processQueue();
        this.didUpdateNode();
    }

    /**
   * @category Information
   * @description A safe display label for any queued sound: the protocol
   * only requires play/stop/addDelegate/removeDelegate — description() is
   * optional (SvWaSound lacks it; SvMusicTrack has it).
   * @param {Object} sound
   * @returns {String}
   */
    descriptionForSound (sound) {
        if (sound && typeof sound.description === "function") {
            return sound.description();
        }
        if (sound && typeof sound.svTypeId === "function") {
            return sound.svTypeId();
        }
        return String(sound);
    }

    /**
   * @category Queue Management
   * @description Processes the next item in the queue if no sound is currently playing.
   * @returns {SvAudioQueue} The audio queue instance.
   */
    processQueue () {
        if (this.isPaused()) {
            return this; // transport hold — resume() releases
        }
        if (!this.currentSound()) {
            const q = this.queue();
            if (q.length) {
                const sound = q.shift();
                //console.log(this.svType() + " POP " + sound.description());
                this.playSound(sound);
            }
        }
        return this;
    }

    /**
   * @async
   * @category Playback Control
   * @description Plays a sound.
   * @param {SvWaSound} sound - The sound.
   */
    async playSound (sound) {
    //this.pause();
        // A skip-if-not-ready sound whose data hasn't arrived by its turn is
        // SKIPPED when other sounds are waiting behind it — sound.play()
        // awaits its fetch+decode while currentSound holds the queue, so a
        // slow remote fetch would otherwise pause everything queued behind
        // it (e.g. narration). With an EMPTY queue there is nothing to hold
        // up, so we wait for the fetch instead: a sound queued while the
        // queue is idle would otherwise never play its first, uncached time.
        if (sound.skipIfNotReady && sound.skipIfNotReady() && !sound.isReadyToPlayNow() && this.queueSize() > 0) {
            console.warn(this.logPrefix(), "skipping sound not ready at its turn:", this.descriptionForSound(sound));
            this.processQueue();
            return this;
        }
        if (this.isMuted()) {
            console.log(this.logPrefix(), "DROPPING sound (queue is muted):", this.descriptionForSound(sound));
        } else {
            console.log(this.logPrefix(), "playing:", this.descriptionForSound(sound),
                "| ready:", (sound.isReadyToPlayNow ? sound.isReadyToPlayNow() : "(n/a)"),
                "| queued behind:", this.queueSize());
        }
        if (!this.isMuted()) {
            //sound.setData(audioBlob);
            sound.addDelegate(this);
            this.setCurrentSound(sound);
            try {
                // resolves at end-of-playback; on the normal path the sound
                // posts onSoundEnded (which advances the queue) just before
                // this resolves
                await sound.play();
            } catch (error) {
                console.warn(this.logPrefix(), "sound failed to play:", error ? error.message : error, "-", this.descriptionForSound(sound));
            } finally {
                // A sound that never actually played (missing data, failed
                // fetch or decode) never posts onSoundEnded. Without this,
                // it would hold currentSound forever and silently wedge the
                // queue — every later sound queues behind it, never playing.
                if (this.currentSound() === sound) {
                    sound.removeDelegate(this);
                    this.setCurrentSound(null);
                    this.processQueue();
                    this.didUpdateNode();
                }
            }
        } else {
            this.processQueue();
        }
        return this;
    }

    /**
   * @category Playback Control
   * @description Handles the end of a sound.
   * @param {SvWaSound} waSound - The sound.
   */
    onSoundEnded (waSound) {
        waSound.removeDelegate(this);
        this.logDebug("finished playing");
        this.setCurrentSound(null);
        // pause() re-queues the interrupted sound to replay on resume — that
        // stop also lands here, but the sound didn't finish: don't file it
        // into played history (it sits at the front of the queue instead).
        if (!(this.isPaused() && this.queue()[0] === waSound)) {
            this.recordPlayedSound(waSound);
        }
        this.processQueue();
        this.didUpdateNode();
    }

    // --- transport (pause / resume / sentence skips) ---
    // The playhead model: playedSounds (history) + queue (future); the
    // boundary between them is the playhead. Skips move sounds across the
    // boundary but never play — only resume() does. Sentence-granular skips
    // count only spoken-transcript sounds; interleaved effects and <break>
    // fillers ride along with the sentence they precede.

    /**
   * @category Transport
   * @description How many finished sounds to retain for backward skips.
   * @returns {number}
   */
    maxPlayedSoundsCount () {
        return 50;
    }

    recordPlayedSound (sound) {
        const played = this.playedSounds();
        played.push(sound);
        while (played.length > this.maxPlayedSoundsCount()) {
            played.shift();
        }
        return this;
    }

    /**
   * @category Transport
   * @description Whether a sound is a spoken sentence for skip counting —
   * it carries a transcript that isn't a silent <break> filler.
   * @param {Object} sound
   * @returns {boolean}
   */
    soundHasSpokenTranscript (sound) {
        const t = (sound && sound.transcript) ? sound.transcript() : null;
        return Type.isString(t) && t.trim().length > 0 && !t.trim().startsWith("<break");
    }

    /**
   * @category Transport
   * @description The transcript at the playhead: the next spoken sentence
   * that resume() would (eventually) play, or null at the live edge.
   * @returns {String|null}
   */
    playheadTranscript () {
        const next = this.queue().find(s => this.soundHasSpokenTranscript(s));
        return next ? next.transcript() : null;
    }

    /**
   * @category Transport
   * @description Pauses playback: the interrupted sound is re-queued to
   * replay from its start on resume; everything queued waits. Idempotent.
   * (Also finally makes setIsMuted(true)'s pause() call safe — it threw
   * "pause not supported" before the transport existed.)
   * @returns {SvAudioQueue}
   */
    pause () {
        if (this.isPaused()) {
            return this;
        }
        this.setIsPaused(true);
        const current = this.currentSound();
        if (current) {
            this.queue().unshift(current); // replay from its start on resume
            if (current.stop) {
                current.stop(); // its ended path sees the pause re-queue and skips history
            }
        }
        this.didUpdateNode();
        return this;
    }

    /**
   * @category Transport
   * @description Releases a pause and plays on from the playhead.
   * @returns {SvAudioQueue}
   */
    resume () {
        if (!this.isPaused()) {
            return this;
        }
        this.setIsPaused(false);
        this.processQueue();
        this.didUpdateNode();
        return this;
    }

    /**
   * @category Transport
   * @description Moves the playhead back by up to sentenceCount spoken
   * sentences (history permitting), pausing first if needed. Does not play.
   * @param {number} sentenceCount
   * @returns {String|null} the transcript now at the playhead.
   */
    skipBack (sentenceCount) {
        this.pause();
        const played = this.playedSounds();
        let moved = 0;
        while (moved < sentenceCount && played.length > 0) {
            const sound = played.pop();
            this.queue().unshift(sound);
            if (this.soundHasSpokenTranscript(sound)) {
                moved += 1;
            }
        }
        this.didUpdateNode();
        return this.playheadTranscript();
    }

    /**
   * @category Transport
   * @description Moves the playhead forward by up to sentenceCount spoken
   * sentences, clamped at the live edge (the newest not-yet-spoken
   * sentence), pausing first if needed. Does not play.
   * @param {number} sentenceCount
   * @returns {String|null} the transcript now at the playhead.
   */
    skipForward (sentenceCount) {
        this.pause();
        let moved = 0;
        while (moved < sentenceCount) {
            const q = this.queue();
            const index = q.findIndex(s => this.soundHasSpokenTranscript(s));
            if (index === -1) {
                break; // live edge — nothing spoken left to skip
            }
            q.splice(0, index + 1).forEach(s => this.recordPlayedSound(s));
            moved += 1;
        }
        this.didUpdateNode();
        return this.playheadTranscript();
    }

    /**
   * @category Queue Management
   * @description Stops the current sound and removes all items from the queue.
   */
    stopAndClearQueue () {
        const audio = this.currentSound();
        if (audio) {
            audio.stop();
        // this.onSoundEnded(audio); // needed?
        }
        this.setQueue([]);
        this.setPlayedSounds([]); // transport history dies with the queue
        this.setIsPaused(false);
    }

    /**
   * @category Debug
   * @description Returns a debug description of the audio queue.
   * @returns {string} The debug description.
   */
    debugDescription () {
        return this.svType() + " " + this.id();
    }

}.initThisClass());
