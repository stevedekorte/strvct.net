"use strict";

/**
 * @class SvAiConversation_errorRecovery
 * @extends SvAiConversation
 * @classdesc Error-recovery category of SvAiConversation — load hygiene,
 * wedge detection, and passive self-healing for EVERY conversation type.
 *
 * A conversation can wedge when a turn dies mid-flight (closed browser,
 * network drop, exhausted retries): incomplete messages gate chat input
 * forever, orphaned blocking tool calls never settle, and empty placeholder
 * shells accumulate. This machinery previously lived only on the app's
 * session chat subclass, so other conversations (character/campaign
 * assistants) could never recover. It belongs here, on the shared base.
 *
 * Design rules (see the app's Assistant Error Recovery plan):
 * - Losing a little history is acceptable; repeating a side effect is not.
 *   A re-run state patch double-applies; a re-run image generation bills
 *   again. So the passive heal NEVER re-requests or replays anything — it
 *   only settles wreckage (mark failed, clear orphaned calls) so input
 *   unblocks and the user's next message starts a clean turn.
 * - Loading a conversation is a healing event (finalInit / materialization /
 *   prepareForFirstAccess all run the hygiene pass).
 * - Player-pending tool calls (rolls, choices awaiting a human) are NOT
 *   wreckage and always survive the heal.
 *
 * Subclasses may override shouldAutoHealOnLoad() to keep a manual-only
 * flow, recoverErroredMessage() for type-specific recovery, and
 * syncRecoveryAffordance() / defaultHeaderNode() for custom placement of
 * the recovery action.
 */

(class SvAiConversation_errorRecovery extends SvAiConversation {

    initPrototypeSlots_errorRecovery () {

        {
            // Transient: rebuilt per page load, never stored.
            const slot = this.newSlot("recoveryActionNode", null);
            slot.setSlotType("SvActionField");
        }

    }

    // --- wedge detection ---

    /**
     * @description True when the message has an in-flight AI request (live
     * XHR). Load-hygiene and recovery both treat "incomplete" as "leftover
     * from a dead session" — an assumption auto-started sessions broke:
     * navigation can trigger hygiene WHILE the opening response streams. A
     * live response is neither stale (must not be swept) nor stuck (must
     * not raise the recovery affordance).
     *
     * Request PRESENCE, not XHR activity: the request object is assigned
     * before its XHR opens (checking isActive() here re-created the false
     * positive in that window), and it is never persisted — so a dead
     * reload leftover always reads null while any cycle this page-load
     * started reads non-null.
     * @param {SvConversationMessage} m
     * @returns {Boolean}
     * @category Error Recovery
     */
    messageHasLiveRequest (m) {
        return !!(m && typeof m.request === "function" && m.request());
    }

    messagesWithErrors () {
        return this.messages().select(m => m.hasError());
    }

    firstMessageWithErrors () {
        return this.messagesWithErrors().first();
    }

    hasMessagesWithErrors () {
        return this.messagesWithErrors().length > 0;
    }

    lastUserMessage () {
        return this.messages().reverseDetect(m => m.isUserMessage());
    }

    /**
     * @description Incomplete input-gating messages that will never finish
     * on their own: no live request, not legitimately awaiting a player's
     * answer (roll/choice). These are the wreckage a dead turn leaves
     * behind. (incompleteMessages() already excludes errored messages —
     * an error is terminal, not stuck.)
     * @returns {Array}
     * @category Error Recovery
     */
    stuckIncompleteMessages () {
        return this.incompleteMessages().filter(m =>
            !this.messageHasLiveRequest(m)
            && !(typeof m.isAwaitingAnswer === "function" && m.isAwaitingAnswer()));
    }

    /**
     * @description True while any non-errored incomplete message has a live
     * request — a turn is genuinely in flight, so nothing should be healed.
     * @returns {Boolean}
     * @category Error Recovery
     */
    hasLiveResponseInFlight () {
        return this.messages().some(m =>
            typeof m.isComplete === "function" && !m.isComplete()
            && !m.hasError()
            && this.messageHasLiveRequest(m));
    }

    /**
     * @description True when something warrants the recovery affordance: an
     * errored message, or a stuck incomplete one.
     * @returns {Boolean}
     * @category Error Recovery
     */
    needsRecovery () {
        return this.hasMessagesWithErrors() || this.stuckIncompleteMessages().length > 0;
    }

    // --- load hygiene ---

    /**
     * @description Load-time hygiene over the message list. Runs at
     * finalInit for eagerly-loaded conversations, at first materialization
     * for lazily-loaded ones, and again at prepareForFirstAccess. Idempotent
     * and passive: sweeps wreckage, never re-requests.
     * @returns {SvAiConversation}
     * @category Error Recovery
     */
    runLoadHygiene () {
        this.removeTrailingEmptyAiPlaceholders();
        this.removeStaleDraftMessages();
        if (this.shouldAutoHealOnLoad()) {
            this.autoHealStuckState();
        }
        this.syncRecoveryAffordance();
        return this;
    }

    /**
     * @description Whether loading auto-heals stuck state (see
     * autoHealStuckState). Default true; a subclass with its own
     * manual-only recovery flow may return false.
     * @returns {Boolean}
     * @category Error Recovery
     */
    shouldAutoHealOnLoad () {
        return true;
    }

    didMaterializeSlot (aSlot) {
        super.didMaterializeSlot(aSlot); // SvConversation wires message back-pointers
        if (aSlot.name() === "subnodes") {
            this.runLoadHygiene();
        }
    }

    // On reload, the conversation may end with an empty AI response
    // placeholder that requestResponse() created when the user's last
    // message completed but whose stream never landed (closed browser,
    // network drop). It carries isComplete=false and zero content — safe to
    // drop. Without this cleanup the UI raises the recovery affordance on
    // every reload of a conversation whose final save raced the AI stream.
    removeTrailingEmptyAiPlaceholders () {
        let removed = 0;
        while (this.messages().length > 0) {
            const last = this.messages().last();
            const isAiResponse = last.isKindOf && SvAiResponseMessage && last.isKindOf(SvAiResponseMessage);
            const isEmpty = typeof last.content === "function" ? !last.content() : true;
            const isIncomplete = typeof last.isComplete === "function" ? !last.isComplete() : true;
            if (isAiResponse && isEmpty && isIncomplete && !this.messageHasLiveRequest(last)) {
                last.delete();
                removed += 1;
            } else {
                break;
            }
        }
        if (removed > 0) {
            console.log(this.logPrefix() + " removed " + removed + " trailing empty AI placeholder(s) on load");
        }
    }

    // A typing-draft placeholder persisted mid-compose (an auto-save raced
    // an active draft) reloads as an empty, incomplete user message —
    // isTyping is not stored, so it can't be matched on reload. The typer is
    // long gone; drop it. Committed user messages always carry content, so
    // the only empty + incomplete user message is a stale draft. "Empty"
    // tolerates a bare speaker-attribution tag (the characterName markup a
    // prepareUserInputMessage override wraps around typed text) with
    // nothing after it. Request messages (rolls/choices — anything with an
    // isAwaitingAnswer contract) live as contentless non-complete messages
    // by design and are exempt.
    removeStaleDraftMessages () {
        const stale = this.messages().select(m =>
            typeof m.role === "function" && m.role() === "user"
            && typeof m.isComplete === "function" && !m.isComplete()
            && typeof m.content === "function"
            && (!m.content() || /^(<characterName>[^<]*<\/characterName>)?\s*$/.test(m.content()))
            && !(typeof m.isAwaitingAnswer === "function")
        );
        stale.forEach(m => m.delete());
        if (stale.length > 0) {
            console.log(this.logPrefix(), "removeStaleDraftMessages removed:", stale.length);
        }
    }

    // --- passive auto-heal ---

    /**
     * @description The tool-call ids of request messages still awaiting a
     * player's act (rolls, choices). These calls must survive any recovery:
     * with the call erased the answer could never deliver its result and
     * chat input would wedge.
     * @returns {Set}
     * @category Error Recovery
     */
    awaitingAnswerCallIds () {
        return new Set(this.messages()
            .filter(m => typeof m.isAwaitingAnswer === "function" && m.isAwaitingAnswer()
                && typeof m.toolCallId === "function" && m.toolCallId())
            .map(m => m.toolCallId()));
    }

    /**
     * @description Passive heal: settle a dead turn's wreckage so input
     * unblocks. Marks stuck incomplete messages as failed (an error is
     * TERMINAL — it stops gating input, and the failure stays visible in
     * the transcript as the record of what happened) and clears orphaned
     * incomplete tool calls. Never re-requests, never replays: no side
     * effect can repeat. The user's next message drives a fresh turn.
     * @returns {SvAiConversation}
     * @category Error Recovery
     */
    autoHealStuckState () {
        if (this.hasLiveResponseInFlight()) {
            return this; // a streaming turn is not wreckage
        }
        const stuck = this.stuckIncompleteMessages();
        stuck.forEach(m => {
            console.warn(this.logPrefix(), "auto-heal: marking stuck incomplete " + m.svType() + " as failed (no live request)");
            m.setError(new Error("Interrupted — this did not finish. Send a new message to continue."));
        });
        this.clearOrphanedToolCalls();
        return this;
    }

    /**
     * @description Removes incomplete tool calls whose work can never
     * finish (their turn is dead), preserving player-pending ones. Only
     * safe when no response is in flight — callers guard on that.
     * @returns {SvAiConversation}
     * @category Error Recovery
     */
    clearOrphanedToolCalls () {
        const toolKit = (typeof this.assistantToolKit === "function") ? this.assistantToolKit() : null;
        if (!toolKit) {
            return this;
        }
        const keepCallIds = this.awaitingAnswerCallIds();
        const calls = toolKit.toolCalls();
        calls.incompleteCalls().slice().forEach(tc => {
            if (!keepCallIds.has(tc.callId())) {
                console.warn(this.logPrefix(), "auto-heal: clearing orphaned incomplete tool call "
                    + (typeof tc.toolName === "function" ? tc.toolName() : "?") + " (" + tc.callId() + ")");
                calls.removeSubnode(tc);
            }
        });
        return this;
    }

    // --- recovery affordance ---

    /**
     * @description What the header shows when no recovery is needed.
     * Default none; subclasses with a standing header override.
     * @returns {SvNode|null}
     * @category Error Recovery
     */
    defaultHeaderNode () {
        return null;
    }

    recoveryActionNodeCreateIfNeeded () {
        if (!this.recoveryActionNode()) {
            const f = SvActionField.clone();
            f.setTitle("Recover from Errors");
            f.setCanDelete(false);
            f.setTarget(this);
            f.setMethodName("softRecoverFromErrors");
            this.setRecoveryActionNode(f);
        }
        return this.recoveryActionNode();
    }

    /**
     * @description Shows the recovery action in the conversation header
     * while recovery is warranted, restores the default header when not.
     * @returns {SvAiConversation}
     * @category Error Recovery
     */
    syncRecoveryAffordance () {
        if (this.needsRecovery()) {
            const recovery = this.recoveryActionNodeCreateIfNeeded();
            if (this.headerNode() !== recovery) {
                this.setHeaderNode(recovery);
                this.didUpdateNode();
            }
        } else if (this.recoveryActionNode() && this.headerNode() === this.recoveryActionNode()) {
            this.setHeaderNode(this.defaultHeaderNode());
            this.didUpdateNode();
        }
        return this;
    }

    /**
     * @description Delegate hook (SvConversationMessage.didUpdateSlotError):
     * an errored message is terminal, so re-evaluate the affordance now —
     * the other evaluation points (load hygiene, completion) never fire for
     * a message that stays incomplete.
     * @category Error Recovery
     */
    onMessageError (/*aMsg*/) {
        this.scheduleMethod("syncRecoveryAffordance");
    }

    // --- manual recovery action ---

    /**
     * @description The recovery action. Base semantics are PASSIVE, matching
     * the auto-heal: settle stuck state, then dispose of errored messages
     * via recoverErroredMessage (base: remove them). No re-request — a
     * replayed turn can repeat side-effecting tool calls (state patches,
     * paid image generations). Subclasses with a replay-safe flow override.
     * @returns {SvAiConversation}
     * @category Error Recovery
     */
    softRecoverFromErrors () {
        this.autoHealStuckState();
        this.messagesWithErrors().slice().forEach(m => this.recoverErroredMessage(m));
        this.syncRecoveryAffordance();
        return this;
    }

    /**
     * @description Per-message recovery hook. Base: drop the failed message —
     * losing it is better than keeping a wedge, and nothing re-executes.
     * Subclasses add type-specific handling (retry a media generation,
     * reprocess a response) where they can bound the side effects.
     * @param {SvConversationMessage} msg
     * @returns {SvAiConversation}
     * @category Error Recovery
     */
    recoverErroredMessage (msg) {
        console.warn(this.logPrefix(), "recovery: removing errored " + msg.svType());
        msg.delete();
        return this;
    }

}).initThisCategory();
