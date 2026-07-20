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
        const reason = aRequest.stopReason ? aRequest.stopReason() : null;
        const detail = (reason && aRequest.stopReasonDescription)
            ? aRequest.stopReasonDescription()
            : (aRequest.error() ? aRequest.error().message : "unknown error");
        const label = reason || "error";
        return "⚠️ [System] The previous response could not be completed — "
            + label + ": " + detail
            + " This is a system-level failure, not something the player did wrong. "
            + "On the next attempt, respond more concisely or rephrase to avoid the same "
            + "failure; the player may also try a different input.";
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
    onRequestComplete (/*aRequest*/) {

        //this.setRequest(null)
        //this.setStatus("complete");
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
    onStreamEnd (/*request*/) {

        //this.setContent(request.fullContent()); // all data has already been sent
        this.setIsComplete(true);
        this.sendDelegateMessage("onMessageUpdate");
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
