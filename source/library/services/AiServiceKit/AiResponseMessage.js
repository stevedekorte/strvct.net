/**
 * @module library.services.AiServiceKit
 */

/**
 * @class AiResponseMessage
 * @extends AiMessage
 * @classdesc Represents an AI response message in a conversation.
 */
(class AiResponseMessage extends AiMessage {

  /**
   * Initializes the prototype slots for the AiResponseMessage class.

   */
  initPrototypeSlots () {
    /**
     * @property {AiRequest} request - The associated request object.
     */
    {
      const slot = this.newSlot("request", null);
      slot.setAllowsNullValue(true);
      slot.setLabel("request");
      slot.setShouldStoreSlot(true); // TODO: remove when not debugging
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("AiRequest");
      slot.setCanInspect(true);
    }

    /**
     * @property {Class} requestClass - The class of the request object.
     */
    {
      const slot = this.newSlot("requestClass", null);
      slot.setAllowsNullValue(true);
      slot.setLabel("Request Class");
      slot.setShouldStoreSlot(false);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("AiRequest Class");
      slot.setCanInspect(false);
    }

    /**
     * @property {boolean} isResponse - Indicates if this is a response message.
     */
    {
      const slot = this.newSlot("isResponse", false);
      slot.setShouldStoreSlot(true)
      slot.setSlotType("Boolean")
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
    }

    /**
     * @property {number} retryCount - The number of retry attempts.
     */
    {
      const slot = this.newSlot("retryCount", 0);
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
      slot.setSlotType("Number");
      //slot.setShouldStoreSlot(true);
    }

    /**
     * @property {string} summaryMessage - A summary of the message.
     */
    {
      const slot = this.newSlot("summaryMessage", null);
      slot.setSlotType("String");
      slot.setInspectorPath(this.type());
      //slot.setShouldStoreSlot(true);
    }

    /**
     * @property {number} temperature - The temperature parameter for AI generation.
     */
    {
      // See: https://aipromptskit.com/openai-temperature-parameter/
      const slot = this.newSlot("temperature", 0.7); // 0-1, higher = more creative // was 0.7
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
      slot.setSlotType("Number");
      //slot.setShouldStoreSlot(true);
    }

    /**
     * @property {number} topP - The top_p parameter for AI generation.
     */
    {
      // See: https://aipromptskit.com/openai-temperature-parameter/
      const slot = this.newSlot("topP", 0.8); // 0-1, higher = more diverse // top_p on Claude3 // was 0.8
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
      slot.setSlotType("Number");
      //slot.setShouldStoreSlot(true);
    }

    /**
     * @property {Promise} completionPromise - A promise that resolves when the response is complete.
     */
    {
      const slot = this.newSlot("completionPromise", null);
      slot.setSlotType("Promise");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  /**
   * Initializes the AiResponseMessage instance.

   */
  init () {
    super.init();
    this.setContent("")
    this.setCanDelete(true);
    this.setIsVisibleToAi(true);
    this.setRole("assistant");

    this.setRequestClass(AiRequest); // subclasses should set this
  }

  /**
   * Performs final initialization of the AiResponseMessage instance.

   */
  finalInit () {
    super.finalInit();
    this.setCompletionPromise(Promise.clone());
    if (this.isComplete()) {
      this.completionPromise().callResolveFunc(this.content());
    }
  }

  /**
   * Gets the request class from the parent chain.

   * @returns {Class} The request class.
   */
  requestClass () {
    const node = this.firstParentChainNodeThatRespondsTo("chatRequestClass");
    return node.chatRequestClass();
  }

  /**
   * Checks if this is a response message.

   * @returns {boolean} True if this is a response message.
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
   */
  valueIsEditable () {
    return false;
  }

  /**
   * Gets the AI speaker name.

   * @returns {string} The AI speaker name.
   */
  aiSpeakerName () {
    return "OpenAI"
  }

  /**
   * Throws an error as send should not be called on a response.

   * @throws {Error} Always throws an error.
   */
  send () {
    throw new Error("shouldn't call send on a response");
    // NOTE: things like system messages for prompt are not response messages, so we can send them
  }

  /**
   * Throws an error as requestResponse should not be called on a response.

   * @throws {Error} Always throws an error.
   */
  requestResponse () {
    throw new Error("shouldn't call requestResponse on a response");
  }

  /**
   * Gets the chat model from the conversation.

   * @returns {Object} The chat model.
   */
  chatModel () {
    return this.conversation().chatModel()
  }

  /**
   * Gets the service from the conversation.

   * @returns {Object} The service.
   */
  service () {
    return this.conversation().service()
  }

  /**
   * Gets the API key from the service.

   * @returns {string} The API key.
   */
  apiKey () {
    return this.service().apiKey()
  }

  /**
   * Makes a new request and starts streaming the response.

   * @returns {AiResponseMessage} This instance.
   */
  makeRequest () {
    this.setError(null);
    const request = this.newRequest();
    this.setRequest(request);
    request.asyncSendAndStreamResponse();
    return this
  }

  /**
   * Gets the JSON history for the request.

   * @returns {Array} An array of message JSON objects.
   */
  jsonHistory () {
    // subclasses can override this to modify the history sent with the request
    const messages = this.visiblePreviousMessages();
    let jsonHistory = messages.map(m => m.messagesJson());
    if (this.conversation().filterJsonHistory) {
      jsonHistory = this.conversation().onFilterJsonHistory(jsonHistory);
    }
    return jsonHistory;
  }

  /**
   * Creates a new request object.

   * @returns {AiRequest} The new request object.
   */
  newRequest () {
    const request = this.requestClass().clone();
    request.setService(this.service());

    request.setDelegate(this);
    //request.setStreamTarget(this); // unify with delegate

    request.setBodyJson({
      model: this.chatModel().modelName(),
      temperature: this.temperature(), 
      top_p: this.topP(),
      messages: this.jsonHistory()
    });
    return request;
  }

  /**
   * Shows request information.

   */
  showRequestInfo () {

  }

  /**
   * Gets the visible previous messages for the AI.

   * @returns {Array} An array of visible previous messages.
   */
  visiblePreviousMessages () {
    // give conversation a chance to control this
    // which may be useful for summaries
    const messages = this.conversation().aiVisibleHistoryForResponse(this); 
    return messages;
  }

  /**
   * Handles the beginning of a request.

   * @param {AiRequest} aRequest - The request object.
   */
  onRequestBegin (aRequest) {

  }

  /**
   * Handles request errors.

   * @param {AiRequest} aRequest - The request object.
   */
  onRequestError (aRequest) {
    console.log("ERROR: ", aRequest.error().message);
    this.setError(aRequest.error());
    const msg = aRequest.error().message;
    /*
    if (msg.includes("Please try again in 6ms.")) {
      this.setRetryCount(this.retryCount() + 1);
      const seconds = Math.pow(2, this.retryCount());
      console.warn("WARNING: retrying openai request in " + seconds + " seconds");
      this.addTimeout(() => this.makeRequest(), seconds*1000);
    }
    */
  }

  /**
   * Gets the value error message.

   * @returns {string|null} The error message or null if no error.
   */
  valueError () {
    const e = this.error();
    return e ? e.message : null;
  }

  /**
   * Handles the completion of the response.

   */
  onComplete () {
    super.onComplete() // sends a delegate message
    this.completionPromise().callResolveFunc();
    // to be overridden by subclasses
  }

  /**
   * Handles the completion of a request.

   * @param {AiRequest} aRequest - The request object.
   */
  onRequestComplete (aRequest) {
   // debugger;
    //this.setRequest(null)
    //this.setStatus("complete")
    this.setIsComplete(true);
    this.sendDelegate("onMessageComplete");
  }

  /**
   * Checks if the content begins with a response tag.

   * @returns {boolean} True if the content begins with a response tag.
   */
  beginsWithResponseTag () {
    return this.fullContent().startsWith("<response>");
  }

  /**
   * Checks if the content ends with a response tag.

   * @returns {boolean} True if the content ends with a response tag.
   */
  endsWithResponseTag () {
    return this.fullContent().endsWith("</response>");
  }

  /**
   * Handles the start of a stream.

   * @param {AiRequest} request - The request object.
   */
  onStreamStart (request) {
  }
  
  /**
   * Handles incoming stream data.

   * @param {AiRequest} request - The request object.
   * @param {string} newContent - The new content received.
   */
  onStreamData (request, newContent) {
    this.setContent(request.fullContent())
    this.sendDelegate("onMessageUpdate")
  }
  
  /**
   * Handles the end of a stream.

   * @param {AiRequest} request - The request object.
   */
  onStreamEnd (request) {
    //debugger;
    //this.setContent(request.fullContent()); // all data has already been sent
    this.setIsComplete(true);
    this.sendDelegate("onMessageUpdate");
  }

  /**
   * Handles value input.

   */
  onValueInput () {
    this.requestResponse();
  }

  /**
   * Shuts down the response message.

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
   */
  delete () {
    this.shutdown();
    return super.delete();
  }

}.initThisClass());