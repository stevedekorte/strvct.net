"use strict";

/*
 * @class SvSimulatedUserController
 * @extends SvSummaryNode
 * @classdesc A simulated user of an SvAiConversation: attach one to a
 * conversation, activate it, and it plays the human — answering pending
 * user requests and typing turns — until deactivated or its turn cap fires.
 *
 * Naked-objects control surface: the node's slots ARE its UI. personaPrompt,
 * chatModelName, maxTurns, pollIntervalMs are editable fields; isActive is
 * the switch; turnCount / stopReason / subtitle show live status.
 *
 * Engine: a coarse poll over settled conversation state, NOT message events.
 * Events fire at the wrong moments — a response completes while its tool
 * work (queued patches, request messages not yet created) is still in
 * flight, and nothing message-shaped fires when that work later settles. So
 * each tick asks "what is the conversation waiting on NOW?" and acts only
 * when the answer is "the user":
 *   - pending user requests (rolls, choices) → answer them
 *   - anything incomplete / in flight       → wait
 *   - settled, assistant prose is the last word → type the next user turn
 * Ticks are serialized: while an action is in flight, ticks no-op.
 *
 * Subclass hooks: canRun(), shouldAnswerRequest(request),
 * defaultChatModelName(). App request messages implement
 * answerAsSimulatedUser(controller) and may call back into
 * asyncNextUserText() when their answer needs generated text.
*/

(class SvSimulatedUserController extends SvSummaryNode {

    initPrototypeSlots () {

        {
            // The observed conversation this controller plays the user of.
            // A runtime pointer — the controller is a transient debugging /
            // automation construct for now (storable seat-binding can come
            // later without reshaping).
            const slot = this.newSlot("conversation", null);
            slot.setSlotType("SvAiConversation");
            slot.setShouldStoreSlot(false);
        }

        {
            // Who the simulated user is. Null → ask the conversation
            // (simulatedUserPersonaPrompt), which apps override per assistant.
            const slot = this.newSlot("personaPrompt", null);
            slot.setSlotType("String");
            slot.setLabel("persona prompt");
            slot.setAllowsNullValue(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setShouldStoreSlot(false);
        }

        {
            // The brain's model. Null → defaultChatModelName() → service
            // default. Kept distinct from the observed assistant's model to
            // reduce self-collusion.
            const slot = this.newSlot("chatModelName", null);
            slot.setSlotType("String");
            slot.setLabel("model");
            slot.setAllowsNullValue(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setShouldStoreSlot(false);
        }

        {
            // The switch. Turning it on starts the poll; the poll
            // self-terminates when it goes off (checked each tick).
            const slot = this.newSlot("isActive", false);
            slot.setSlotType("Boolean");
            slot.setLabel("active");
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
        }

        {
            // Hard cap on simulated-user actions per run (typed turns, roll
            // rounds, choice answers all count) — the backstop against
            // unbounded self-play.
            const slot = this.newSlot("maxTurns", 30);
            slot.setSlotType("Number");
            slot.setLabel("max turns");
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("pollIntervalMs", 2000);
            slot.setSlotType("Number");
            slot.setLabel("poll interval (ms)");
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setShouldStoreSlot(false);
        }

        {
            const slot = this.newSlot("turnCount", 0);
            slot.setSlotType("Number");
            slot.setLabel("turns taken");
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("stopReason", null);
            slot.setSlotType("String");
            slot.setLabel("stop reason");
            slot.setAllowsNullValue(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
        }

        {
            // Live status line, shown as the node's subtitle.
            const slot = this.newSlot("status", "inactive");
            slot.setSlotType("String");
            slot.setCanInspect(false);
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("startAction", null);
            slot.setSlotType("Action");
            slot.setLabel("Start");
            slot.setCanInspect(true);
            slot.setActionMethodName("start");
            slot.setSyncsToView(true);
        }

        {
            const slot = this.newSlot("stopAction", null);
            slot.setSlotType("Action");
            slot.setLabel("Stop");
            slot.setCanInspect(true);
            slot.setActionMethodName("stopFromAction");
            slot.setSyncsToView(true);
        }
    }

    initPrototype () {
        this.setShouldStore(false);
        this.setCanDelete(true);
        this.setNodeCanEditTitle(false);
    }

    title () {
        return "Simulated User";
    }

    subtitle () {
        return this.status();
    }

    // --- lifecycle ---

    /**
     * @description Activate the simulated user (also the Start button).
     * @returns {SvSimulatedUserController}
     * @category Control
     */
    start () {
        this.setStopReason(null);
        this.setTurnCount(0);
        this.setIsActive(true); // didUpdateSlotIsActive starts the poll
        return this;
    }

    /**
     * @description Deactivate, recording why.
     * @param {String} reason
     * @returns {SvSimulatedUserController}
     * @category Control
     */
    stop (reason) {
        this.setStopReason(reason || "stopped");
        this.setIsActive(false);
        this.updateStatus("stopped: " + this.stopReason());
        return this;
    }

    stopFromAction () {
        return this.stop("user");
    }

    didUpdateSlotIsActive (oldValue, newValue) {
        if (newValue) {
            this.updateStatus("starting");
            this.startPoll();
        }
    }

    /**
     * @description Subclass hook: an additional gate checked every tick
     * (e.g. an app may require developer mode). Returning false stops the run.
     * @returns {Boolean}
     * @category Control
     */
    canRun () {
        return true;
    }

    // --- poll engine ---

    startPoll () {
        if (this._isPolling) {
            return; // one poll loop per controller
        }
        this._isPolling = true;
        const tick = async () => {
            if (!this.isActive()) {
                this._isPolling = false;
                return;
            }
            if (!this.canRun()) {
                this._isPolling = false;
                this.stop("canRun() false");
                return;
            }
            if (!this._isActing) {
                this._isActing = true;
                try {
                    await this.tick();
                } catch (e) {
                    console.warn(this.logPrefix(), "simulated user: tick failed — stopping:", e && e.message);
                    this.stop("error: " + (e && e.message));
                } finally {
                    this._isActing = false;
                }
            }
            this.addTimeout(tick, this.pollIntervalMs());
        };
        this.addTimeout(tick, this.pollIntervalMs());
    }

    /**
     * @description One tick: act as the user iff the conversation is waiting
     * on the user. See the class comment for the decision ladder.
     * @category Engine
     */
    async tick () {
        const conv = this.conversation();
        if (!conv) {
            this.stop("no conversation");
            return;
        }
        if (conv.shouldProcessToolCalls && !conv.shouldProcessToolCalls()) {
            this.updateStatus("waiting: client mirror does not drive the AI loop");
            return;
        }
        if (conv.assistantToolKit().hasUncompletedBlockingToolCalls()) {
            await this.answerPendingUserRequests();
            return;
        }
        if (conv.incompleteMessages().length > 0) {
            this.updateStatus("waiting: response in flight");
            return;
        }
        if (conv.hasScheduledAutomation && conv.hasScheduledAutomation()) {
            this.updateStatus("waiting: conversation automation pending");
            return; // e.g. an auto-continue check that may nudge the AI itself
        }
        if (!conv.awaitsUserProse()) {
            this.updateStatus("waiting: not the user's move");
            return;
        }
        if (this.turnCapExceeded()) {
            return;
        }

        const tailMsg = conv.messages().last();
        this.updateStatus("turn " + this.turnCount() + ": thinking");
        const text = await this.asyncNextUserText();
        if (!Type.isString(text) || text.trim().length === 0) {
            console.warn(this.logPrefix(), "simulated user: empty turn — stopping");
            this.stop("empty turn");
            return;
        }
        // Re-check after the async generation (a real user may have typed,
        // the controller may have been stopped) before injecting.
        if (!this.isActive() || conv.messages().last() !== tailMsg) {
            return;
        }
        this.updateStatus("turn " + this.turnCount() + ": typing");
        console.log(this.logPrefix(), "simulated user turn " + this.turnCount() + ": typing into chat");
        conv.onChatInputValue(text);
    }

    /**
     * @description Answer the conversation's pending user requests (rolls,
     * choices — whatever request vocabulary the app defines). Each request
     * answers itself polymorphically via answerAsSimulatedUser(this).
     * @category Engine
     */
    async answerPendingUserRequests () {
        const requests = this.conversation().pendingUserRequests()
            .filter(r => this.shouldAnswerRequest(r));
        if (requests.length === 0) {
            // e.g. a queued silent tool call still executing — its settlement
            // (or the request message it creates) shows up on a later tick
            this.updateStatus("waiting: blocking tool work in flight");
            return;
        }
        if (this.turnCapExceeded()) {
            return;
        }
        for (const request of requests) {
            if (!this.isActive()) {
                return;
            }
            this.updateStatus("turn " + this.turnCount() + ": answering " + request.svType());
            console.log(this.logPrefix(), "simulated user turn " + this.turnCount() + ": answering " + request.svType());
            await request.answerAsSimulatedUser(this);
        }
    }

    /**
     * @description Subclass hook: is this pending request ours to answer?
     * (e.g. a player-bound controller answers only requests addressed to its
     * character). Base answers everything.
     * @param {Object} request
     * @returns {Boolean}
     * @category Engine
     */
    shouldAnswerRequest (/*request*/) {
        return true;
    }

    // --- turn accounting ---

    /**
     * @description Counts one simulated-user action against the cap; stops
     * the run when exceeded. Every action kind counts — an assistant looping
     * on requests alone must still hit the cap.
     * @returns {Boolean} true when the cap is exceeded (run stopped).
     * @category Engine
     */
    turnCapExceeded () {
        this.setTurnCount(this.turnCount() + 1);
        if (this.turnCount() > this.maxTurns()) {
            console.warn(this.logPrefix(), "simulated user: reached max turns (" + this.maxTurns() + ") — stopping");
            this.stop("turn cap (" + this.maxTurns() + ")");
            return true;
        }
        return false;
    }

    // --- the brain ---

    /**
     * @description One simulated-user generation over the conversation's
     * current user-view transcript. Public: request messages call back into
     * this when answering needs generated text (e.g. a choice answer).
     * @returns {Promise<String>}
     * @category Brain
     */
    async asyncNextUserText () {
        const brain = SvSimulatedUserConversation.clone();
        brain.setChatModel(this.resolvedChatModel());
        return brain.asyncUserTurnForTranscript(
            this.resolvedPersonaPrompt(),
            this.conversation().userVisibleTranscript()
        );
    }

    resolvedPersonaPrompt () {
        const explicit = this.personaPrompt();
        if (Type.isString(explicit) && explicit.trim().length > 0) {
            return explicit;
        }
        return this.conversation().simulatedUserPersonaPrompt();
    }

    /**
     * @description Subclass hook: the model to think with when the
     * chatModelName slot is unset. Base defers to the service default.
     * @returns {String|null}
     * @category Brain
     */
    defaultChatModelName () {
        return null;
    }

    resolvedChatModel () {
        const name = this.chatModelName() || this.defaultChatModelName();
        if (name) {
            const model = SvServices.shared().chatModelWithName(name);
            if (model) {
                return model;
            }
            console.warn(this.logPrefix(), "simulated user: no chat model named '" + name + "' — using default");
        }
        return SvServices.shared().defaultChatModel();
    }

    // --- status (deduped: a wait state logs once, not once per tick) ---

    updateStatus (s) {
        if (this.status() !== s) {
            this.setStatus(s);
            console.log(this.logPrefix(), "[simulated-user] " + s);
            this.didUpdateNode(); // refresh the subtitle
        }
    }

}).initThisClass();
