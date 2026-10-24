"use strict";

/**
 * @class SvAiParsedResponseMessage_disclosure
 * @extends SvAiParsedResponseMessage
 * @classdesc Progressive Disclosure: while this device narrates a response
 * aloud, the response is shown only up to and including the sentence being
 * spoken, so the reader and the voice stay together.
 *
 * Two facts about this device's narration of this message — not stored, not
 * sent to anyone: whether it is disclosing, and the index of the last
 * sentence revealed. The tile derives what it shows from them
 * (SvChatMessageTile.syncDisclosure). Disclosure starts with a live response
 * on a device that narrates it and whose conversation wants it (duck-typed
 * `wantsProgressiveDisclosure()`), advances as each sentence starts being
 * spoken, and ends — everything shown — when the last sound ends after the
 * stream, when narration stops for any reason, or when nothing has advanced
 * for a while (a sound lost by the speaker).
 */

(class SvAiParsedResponseMessage_disclosure extends SvAiParsedResponseMessage {

    initPrototypeSlots_disclosure () {
        {
            const slot = this.newSlot("isDisclosing", false); // this device shows the response only as far as it has been spoken
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }
        {
            const slot = this.newSlot("disclosedThrough", -1); // the index of the last sentence revealed (-1: none yet)
            slot.setSlotType("Number");
            slot.setSyncsToView(true);
        }
    }

    /**
     * @description How long disclosure waits without a sentence starting
     * before it shows everything: a sound the speaker dropped (cleared by
     * another stop, or failed) would otherwise hide the rest for good.
     * Longer than a sentence and the wait for the next clip's audio.
     * @returns {Number} milliseconds
     * @category Disclosure
     */
    disclosureStallMs () {
        return 25000;
    }

    /**
     * @description Whether this response should be disclosed as it is
     * spoken: this device narrates it, and its conversation wants it.
     * @returns {Boolean}
     * @category Disclosure
     */
    wantsDisclosure () {
        const conv = this.conversation();
        const wanted = !!(conv && typeof conv.wantsProgressiveDisclosure === "function" && conv.wantsProgressiveDisclosure());
        return wanted && this.shouldVoiceNarrate();
    }

    /**
     * @description Starts disclosing a live response, before any of its text
     * arrives — hidden is the default, so text never shows ahead of the voice.
     * @returns {SvAiParsedResponseMessage}
     * @category Disclosure
     */
    beginDisclosureIfWanted () {
        if (!this.wantsDisclosure()) {
            return this;
        }
        this.setDisclosedThrough(-1);
        this.setIsDisclosing(true);
        this.tellConversationDisclosureChanged();
        return this;
    }

    /**
     * @description Shows the response through the sentence with this index.
     * Never moves back (a skip back does not re-hide).
     * @param {Number|null} index
     * @returns {SvAiParsedResponseMessage}
     * @category Disclosure
     */
    advanceDisclosure (index) {
        if (!this.isDisclosing() || !Number.isInteger(index)) {
            return this;
        }
        if (index > this.disclosedThrough()) {
            this.setDisclosedThrough(index);
        }
        this.armDisclosureStallTimer();
        return this;
    }

    /**
     * @description Sentences went out for speech: the wait for them to start
     * is watched (see disclosureStallMs).
     * @category Disclosure
     */
    noteNarrationQueued () {
        if (this.isDisclosing()) {
            this.armDisclosureStallTimer();
        }
        return this;
    }

    armDisclosureStallTimer () {
        this.addTimeout(() => this.revealAll(), this.disclosureStallMs(), "disclosureStall");
        return this;
    }

    /**
     * @description Ends disclosure when the narration of this response is
     * over: the stream has ended and every sentence it queued has been
     * spoken. Called after the stream ends and after each sound ends.
     * @returns {SvAiParsedResponseMessage}
     * @category Disclosure
     */
    finishDisclosureIfNarrationDone () {
        if (this.isDisclosing() && this.isComplete() && !this.hasNarrationPending()) {
            this.revealAll();
        }
        return this;
    }

    /**
     * @description Whether sentences of this response are still waiting to
     * be spoken: a group not yet sent, or sounds queued or playing.
     * @returns {Boolean}
     * @category Disclosure
     */
    hasNarrationPending () {
        const queued = this.queuedSentenceGroups();
        const sounds = this.soundSentences();
        return !!this.narrationGroup() || (!!queued && queued.length > 0) || (!!sounds && sounds.size > 0);
    }

    /**
     * @description Shows the whole response: narration ended or stopped.
     * @returns {SvAiParsedResponseMessage}
     * @category Disclosure
     */
    revealAll () {
        this.clearTimeoutNamed("disclosureStall");
        if (!this.isDisclosing()) {
            return this;
        }
        this.setIsDisclosing(false);
        this.tellConversationDisclosureChanged();
        return this;
    }

    /**
     * @description Lets the conversation know a message started or stopped
     * disclosing (duck-typed `onMessageDisclosureChanged`): the messages
     * that follow a disclosing response wait for it.
     * @category Disclosure
     */
    tellConversationDisclosureChanged () {
        const conv = this.conversation();
        if (conv && typeof conv.onMessageDisclosureChanged === "function") {
            conv.onMessageDisclosureChanged(this);
        }
        return this;
    }

}).initThisCategory();
