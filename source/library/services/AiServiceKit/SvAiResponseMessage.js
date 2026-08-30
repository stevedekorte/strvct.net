/**
 * @module library.services.AiServiceKit
 */

/**
 * @class SvAiResponseMessage
 * @extends SvAiMessage
 * @classdesc Represents an AI response message in a conversation.
 */
(class SvAiResponseMessage extends SvAiMessage {

    /**
   * Initializes the prototype slots for the SvAiResponseMessage class.

   */
    initPrototypeSlots () {
    /**
     * @member {Boolean} didAttemptFailover - Whether this turn already switched
     * to the failover model. Per-message so a failing failover parks the turn
     * instead of ping-ponging between providers.
     * @category Failover
     */
        {
            const slot = this.newSlot("didAttemptFailover", false);
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Boolean");
        }

        /**
     * @member {SvAiChatModel} didFailoverFromChatModel - The model this turn
     * switched AWAY from, so revert policy knows what to restore.
     * @category Failover
     */
        {
            const slot = this.newSlot("didFailoverFromChatModel", null);
            slot.setShouldStoreSlot(false);
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvAiChatModel");
        }

        /**
     * @member {SvAiRequest} request - The associated request object.
     * @category Data
     */
        {
            const slot = this.newSlot("request", null);
            slot.setAllowsNullValue(true);
            slot.setLabel("request");
            // Do NOT persist the AI request. It's a transient object holding
            // the full request body + bodyJson (the entire composed prompt +
            // conversation) — ~660KB per response in a real session — and the
            // response content is already on this message. (This was the
            // "TODO: set to false when not debugging".)
            slot.setShouldStoreSlot(false);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("SvAiRequest");
            slot.setCanInspect(true);
        }

        /**
     * @member {Class} requestClass - The class of the request object.
     * @category Data
     */
        {
            const slot = this.newSlot("requestClass", null);
            slot.setAllowsNullValue(true);
            slot.setLabel("Request Class");
            slot.setShouldStoreSlot(false);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("SvAiRequest class");
            slot.setCanInspect(false);
        }

        /**
     * @member {boolean} isResponse - Indicates if this is a response message.
     * @category Status
     */
        {
            const slot = this.newSlot("isResponse", false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setCanInspect(true);
            slot.setInspectorPath(this.svType());
            slot.setIsInCloudJson(true);
        }

        /**
     * @member {number} retryCount - The number of retry attempts.
     * @category Status
     */
        {
            const slot = this.newSlot("retryCount", 0);
            slot.setCanInspect(true);
            slot.setInspectorPath(this.svType());
            slot.setSlotType("Number");
            //slot.setShouldStoreSlot(true);
        }

        /**
     * @member {string} summaryMessage - A summary of the message.
     * @category Data
     */
        {
            const slot = this.newSlot("summaryMessage", null);
            slot.setSlotType("String");
            slot.setInspectorPath(this.svType());
            //slot.setShouldStoreSlot(true);
        }

        /**
     * @member {number} temperature - The temperature parameter for AI generation.
     * @category Configuration
     */
        {
            // See: https://aipromptskit.com/openai-temperature-parameter/
            const slot = this.newSlot("temperature", 0.7); // 0-1, higher = more creative // was 0.7
            slot.setCanInspect(true);
            slot.setInspectorPath(this.svType());
            slot.setSlotType("Number");
            //slot.setShouldStoreSlot(true);
        }

        /**
     * @member {number} topP - The top_p parameter for AI generation.
     * @category Configuration
     */
        {
            // See: https://aipromptskit.com/openai-temperature-parameter/
            const slot = this.newSlot("topP", 0.8); // 0-1, higher = more diverse // top_p on Claude3 // was 0.8
            slot.setCanInspect(true);
            slot.setInspectorPath(this.svType());
            slot.setSlotType("Number");
            //slot.setShouldStoreSlot(true);
        }

        /**
     * @member {Promise} completionPromise - A promise that resolves when the response is complete.
     * @category Async
     */
        {
            const slot = this.newSlot("completionPromise", null);
            slot.setSlotType("Promise");
            //slot.setShouldStoreSlot(true);
        }

        this.setShouldStore(true);
    }

    /**
   * Initializes the SvAiResponseMessage instance.

   * @category Initialization
   */
    init () {
        super.init();
        this.setContent("");
        // no setCanDelete(true) here: messages are never user-deletable
        // (SvConversationMessage.finalInit and SvConversation.prepareSubnode
        // both enforce false; a true here was dead code that read as intent)
        this.setIsVisibleToAi(true);
        this.setRole("assistant");

        this.setRequestClass(SvAiRequest); // subclasses should set this
    }

    /**
   * Performs final initialization of the SvAiResponseMessage instance.

   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setCompletionPromise(Promise.clone());
        this.setRequest(null); // yes, this will delete the request if it exists so be careful about resuming a broken request
        /*
        if (this.isComplete()) {
            //debugger;
            //this.completionPromise().callResolveFunc(this.content());
        }
        */
    }

    /**
   * Gets the request class from the parent chain.

   * @returns {Class} The request class.
   * @category Data
   */
    requestClass () {
        const node = this.firstParentChainNodeThatRespondsTo("chatRequestClass");
        return node.chatRequestClass();
    }

    /**
   * Checks if this is a response message.

   * @returns {boolean} True if this is a response message.
   * @category Status
   */
    isResponse () {
        return true;
    }

    /*
  finalInit () {
    super.finalInit();
  }
  */

    /**
   * Checks if the value is editable.

   * @returns {boolean} Always returns false for response messages.
   * @category Status
   */
    valueIsEditable () {
        return false;
    }

    /**
   * Gets the AI speaker name.

   * @returns {string} The AI speaker name.
   * @category Data
   */
    aiSpeakerName () {
        return "OpenAI";
    }

    /**
   * Throws an error as send should not be called on a response.

   * @throws {Error} Always throws an error.
   * @category Error Handling
   */
    send () {
        throw new Error("shouldn't call send on a response");
    // NOTE: things like system messages for prompt are not response messages, so we can send them
    }

    /**
   * Throws an error as requestResponse should not be called on a response.

   * @throws {Error} Always throws an error.
   * @category Error Handling
   */
    requestResponse () {
        throw new Error("shouldn't call requestResponse on a response");
    }

    /**
   * Gets the chat model from the conversation.

   * @returns {Object} The chat model.
   * @category Data
   */
    chatModel () {
        return this.conversation().chatModel();
    }

    /**
   * Gets the service from the conversation.

   * @returns {Object} The service.
   * @category Data
   */
    service () {
        return this.chatModel().service();
    }

    /**
   * Gets the API key from the service.

   * @returns {string} The API key.
   * @category Data
   */
    apiKey () {
        return this.service().apiKeyOrUserAuthToken();
    }

    /**
   * Makes a new request and starts streaming the response.

   * @returns {SvAiResponseMessage} This instance.
   * @category Communication
   */
    async asyncMakeRequest () {
        this.setError(null);
        const request = this.newRequest();
        this.setRequest(request);
        await request.asyncSendAndStreamResponse();
        // todo: only clear request if request is successful
        this.setRequest(null);
        return this;
    }

    /**
   * Creates a new request object.
   * @returns {SvAiRequest} The new request object.
   * @category Communication
   */
    newRequest () {
        const request = this.requestClass().clone(); // SvAiRequest class
        request.setChatModel(this.chatModel());
        //request.setService(this.service());

        request.setDelegate(this);
        //request.setStreamTarget(this); // unify with delegate


        const json = {};

        json.model = this.chatModel().modelName();

        if (this.chatModel().supportsTemperature()) {
            json.temperature = this.temperature();
        }

        if (this.chatModel().supportsTopP()) {
            json.top_p = this.topP();
        }


        json.messages = this.jsonHistory();

        request.setBodyJson(json);

        // App-agnostic hook: let the conversation supply per-request headers
        // (e.g. usage attribution) for the requests it spawns. Duck-typed so the
        // framework stays app-blind — a conversation that does not implement it
        // yields no header and no behavior change.
        const conversation = this.conversation();
        if (conversation && typeof conversation.aiRequestCustomHeaders === "function") {
            const headers = conversation.aiRequestCustomHeaders();
            if (headers) {
                request.setCustomHeaders(headers);
            }
        }

        return request;
    }

    /**
   * Shows request information.

   * @category Debugging
   */
    showRequestInfo () {

    }

    /**
   * Gets the visible previous messages for the AI.

   * @returns {Array} An array of visible previous messages.
   * @category Data
   */
    visiblePreviousMessages () {
    // give conversation a chance to control this
    // which may be useful for summaries
        const messages = this.conversation().aiVisibleHistoryForResponse(this);
        return messages;
    }

    /**
   * Handles the beginning of a request.

   * @param {SvAiRequest} aRequest - The request object.
   * @category Event Handling
   */
    onRequestBegin (/*aRequest*/) {

    }

    /**
   * Handles request errors.

   * @param {SvAiRequest} aRequest - The request object.
   * @category Error Handling
   */
    onRequestError (aRequest) {
        const e = aRequest.error();
        console.error(this.logPrefix(), e && e.message);

        // Recoverable failure with a retry already scheduled (e.g. service
        // overloaded): show a plain-language WAITING status, not the terminal
        // notice — and do NOT complete the message. The retry re-streams into
        // this same message (onStreamStart resets content), and premature
        // completion would fire tool processing / auto-continue / self-play
        // on a fake-final message.
        if (e && e.svIsRetrying) {
            this.setContent("⏳ " + e.message + "…");
            this.sendDelegateMessage("onMessageUpdate");
            return;
        }

        // Sustained outage — auto-retries exhausted: park the message
        // INCOMPLETE with its error set. The error state surfaces the chat's
        // recovery affordance (app header button), whose recovery path
        // deletes this stuck turn and re-requests from the last user message
        // — the user initiates the next attempt. Not completed on purpose: a
        // terminal completion would read as "the turn ended" to tool
        // processing and automation, and there is no turn content.
        if (e && e.svRetriesExhausted) {
            // Before parking the turn for user-initiated recovery, try the
            // failover model once. This is the right altitude for the switch:
            // a request object is bound to its provider (requestClass() comes
            // from the conversation's service, which derives from its
            // chatModel), so aRequest.retryRequest() would re-hit the SAME
            // provider. Switching means pointing the conversation at the other
            // model and building a NEW request — which is exactly what
            // asyncMakeRequest() does.
            if (this.asyncTryFailoverModel(e)) {
                return;
            }
            this.setError(e);
            this.setContent("⚠️ " + e.message);
            this.sendDelegateMessage("onMessageUpdate");
            return;
        }

        // Surface the failure IN the conversation rather than as a modal error
        // panel. The notice becomes this response's content, which is
        // dual-purpose:
        //   - the player reads a plain-language explanation of what happened and
        //     what to do, and
        //   - because it stays in the AI-visible history as this turn's assistant
        //     message (contentVisisbleToAi() returns content()), the NEXT request
        //     shows the model that its prior attempt failed, and why, so it can
        //     adjust instead of reproducing the same failure.
        // Marking the message complete unblocks the chat for the next input.
        // Covers stop errors (blocked / malformed / etc.) and transport errors.
        this.setContent(this.requestErrorNoticeText(aRequest));
        this.setIsComplete(true);
        this.sendDelegateMessage("onMessageUpdate");
    }

    /**
   * @description The conversation's configured failover model, or null when
   * none is set, it is the model that just failed, or it is on the same service
   * as the model that just failed (a sibling model shares the outage).
   * @returns {SvAiChatModel|null}
   * @category Failover
   */
    availableFailoverChatModel () {
        const failoverModel = SvServices.shared().defaultFailoverChatModel();
        if (!failoverModel) {
            return null;
        }
        const currentModel = this.chatModel();
        if (!currentModel || failoverModel === currentModel) {
            return null;
        }
        if (failoverModel.service() === currentModel.service()) {
            return null;
        }
        return failoverModel;
    }

    /**
   * @description Last resort before parking a turn: point the conversation at
   * the failover model and re-request into THIS same message, so the player
   * sees one turn that took a while rather than a failure plus a retry.
   *
   * Once per message: the flag is on the message, not the conversation, so a
   * failover that also fails parks the turn normally instead of ping-ponging.
   * The conversation keeps the failover model afterwards — subsequent turns
   * stay on it rather than re-paying the whole retry ladder each turn — and
   * whoever owns revert policy reads didFailoverFromChatModel() to know what to
   * switch back to.
   *
   * Only outage-class failures get here (isRecoverableError gates the ladder),
   * so a malformed request of ours never triggers a provider switch.
   * @param {Error} e - the exhausted-retries error, annotated on success
   * @returns {Boolean} true when a failover attempt was started
   * @category Failover
   */
    asyncTryFailoverModel (e) {
        if (this.didAttemptFailover()) {
            return false;
        }
        const failoverModel = this.availableFailoverChatModel();
        if (!failoverModel) {
            return false;
        }
        const conversation = this.conversation();
        if (!conversation || typeof conversation.setChatModel !== "function") {
            return false;
        }

        const fromName = this.chatModel().modelName();
        const toName = failoverModel.modelName();
        this.setDidAttemptFailover(true);
        this.setDidFailoverFromChatModel(this.chatModel());
        conversation.setChatModel(failoverModel);
        if (e) {
            e.svDidFailover = true;
        }

        console.warn(this.logPrefix(), "model failover: " + fromName +
            " is failing — switching this conversation to " + toName);

        // Visible to the player AND to the model on the next request: the
        // transcript records that the turn changed hands.
        this.setContent("⏳ Switching to a backup AI model (" + toName + ") — one moment…");
        this.sendDelegateMessage("onMessageUpdate");

        // Fire and forget with an explicit rejection handler: asyncMakeRequest
        // returns a promise, and an unhandled rejection here would strand the
        // message exactly the way the failover is meant to prevent.
        this.asyncMakeRequest().catch((failoverError) => {
            const message = failoverError && failoverError.message ? failoverError.message : String(failoverError);
            console.error(this.logPrefix(), "model failover to " + toName + " also failed:", message);
            this.setError(failoverError);
            this.setContent("⚠️ Both the main and backup AI models are failing. " +
                "Press 'Recover from Errors' above to try again.");
            this.sendDelegateMessage("onMessageUpdate");
        });
        return true;
    }

    /**
   * @description Player- and AI-facing text shown when a response request
   * fails. Written to be actionable by BOTH readers: the player (what happened,
   * what to try) and the model on the next request (its previous attempt failed
   * for this reason — adjust, don't repeat). Subclasses may override to wrap it
   * in their rendering markup.
   * @param {SvAiRequest} aRequest
   * @returns {string}
   * @category Error Handling
   */
    requestErrorNoticeText (aRequest) {
        if (this.errorIsTimeout(aRequest)) {
            return "The storyteller took too long to respond. Try again — a shorter action often helps.";
        }
        if (this.errorIsTransport(aRequest)) {
            return "The storyteller lost the connection before finishing. Try again.";
        }
        return "The storyteller could not finish that reply. Try again.";
    }

    errorIsTimeout (aRequest) {
        const request = aRequest || this.request();
        if (request && typeof request.errorIsTimeout === "function" && request.errorIsTimeout()) {
            return true;
        }
        const error = request && request.error ? request.error() : null;
        const message = error && error.message ? error.message : "";
        return /timed?\s*out/i.test(message);
    }

    errorIsTransport (aRequest) {
        const error = aRequest && aRequest.error ? aRequest.error() : null;
        const message = error && error.message ? error.message : "";
        return /request error code:\s*0\b/i.test(message)
            || /connection dropped/i.test(message)
            || /network error/i.test(message);
    }

    /**
   * Gets the value error message.

   * @returns {string|null} The error message or null if no error.
   * @category Error Handling
   */
    valueError () {
        const e = this.error();
        return e ? e.message : null;
    }

    /**
   * Handles the completion of the response.

   * @category Event Handling
   */
    onComplete () {
        super.onComplete(); // sends a delegate message
        if (this.completionPromise().isCompleted()) {
            console.log("completion promise is already completed");
            //debugger;
            return;
        }
        this.completionPromise().callResolveFunc();
    // to be overridden by subclasses
    }

    /**
   * Handles the completion of a request.

   * @param {SvAiRequest} aRequest - The request object.
   * @category Event Handling
   */
    onRequestComplete (aRequest) {
        this.appendRequestInfo(aRequest);
        this.markAsComplete();
    }

    /**
   * Checks if the content begins with a response tag.

   * @returns {boolean} True if the content begins with a response tag.
   * @category Content Analysis
   */
    beginsWithResponseTag () {
        return this.fullContent().startsWith("<response>");
    }

    /**
   * Checks if the content ends with a response tag.

   * @returns {boolean} True if the content ends with a response tag.
   * @category Content Analysis
   */
    endsWithResponseTag () {
        return this.fullContent().endsWith("</response>");
    }

    /**
   * Handles the start of a stream.

   * @param {SvAiRequest} request - The request object.
   * @category Event Handling
   */
    onStreamStart (/*request*/) {
    }

    /**
   * Handles incoming stream data.

   * @param {SvAiRequest} request - The request object.
   * @param {string} newContent - The new content received.
   * @category Event Handling
   */
    onStreamData (request, /*newContent*/) {
        this.setContent(request.fullContent());
        this.sendDelegateMessage("onMessageUpdate");
    }

    /**
   * Handles the end of a stream.

   * @param {SvAiRequest} request - The request object.
   * @category Event Handling
   */
    onStreamEnd (request) {
        this.appendRequestInfo(request || this.request());
        this.setIsComplete(true);
        this.sendDelegateMessage("onMessageUpdate");
    }

    appendRequestInfo (aRequest) {
        const request = aRequest || this.request();
        if (!request) {
            return this;
        }
        const current = this.content() || "";
        if (current.includes("<request-info")) {
            return this;
        }
        const line = this.requestInfoLine(request);
        if (!line) {
            return this;
        }
        this.setContent(current + "<request-info>" + line + "</request-info>");
        return this;
    }

    requestInfoLine (request) {
        const parts = [];
        const inTok = request.inputTokenCount ? request.inputTokenCount() : 0;
        const outTok = request.outputTokenCount ? request.outputTokenCount() : 0;
        if (inTok) {
            parts.push(this.compactCount(inTok) + " in");
        }
        if (outTok) {
            parts.push(this.compactCount(outTok) + " out");
        }
        const secs = request.elapsedSeconds ? request.elapsedSeconds() : 0;
        if (secs) {
            parts.push(secs + "s");
        }
        return parts.join(", ");
    }

    compactCount (n) {
        if (n >= 1000) {
            const k = n / 1000;
            return (k >= 10 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, "")) + "k";
        }
        return String(n);
    }



    /**
   * Handles value input.

   * @category Event Handling
   */
    onValueInput () {
        this.requestResponse();
    }

    /**
   * Shuts down the response message.

   * @category Lifecycle
   */
    shutdown () {
        if (this.request()) {
            this.request().shutdown();
            this.setRequest(null);
        }
    }

    /**
   * Deletes the response message.

   * @returns {*} The result of the parent class's delete method.
   * @category Lifecycle
   */
    delete () {
        this.shutdown();
        return super.delete();
    }

    valueIsComplete () {
        return this.isComplete();
    }

}.initThisClass());
