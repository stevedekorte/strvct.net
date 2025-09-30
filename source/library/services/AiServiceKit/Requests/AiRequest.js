/**
 * @module library.services.AiServiceKit
 */

"use strict";

/**
 * @class AiRequest
 * @extends SvStorableNode
 * @classdesc Wrapper for request to API service that manages streaming the response and checking for various errors.
 *
 * Delegate protocol:
 *
 *   onRequestBegin(request)
 *   onRequestComplete(request)
 *   onRequestError(request, error)
 *
 *   onStreamStart(request)
 *   onStreamData(request, newContent)
 *   onStreamEnd(request)
 *
 * Delegate can get info via:
 *
 *   request.fullContent()
 *   request.status()
 *   request.error()
 *
 */

(class AiRequest extends SvStorableNode {

    initPrototypeSlots () {
    /**
     * @member {Object} delegate - Optional reference to object that owns request
     */
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
        }

        /**
     * @member {SvXhrRequest} currentXhrRequest - The current XHR request being used
     */
        {
            const slot = this.newSlot("currentXhrRequest", null);
            slot.setSlotType("SvXhrRequest");
            slot.setShouldStoreSlot(false);
        }

        /**
     * @member {Array} xhrRequestHistory - History of XHR requests for continuations
     */
        {
            const slot = this.newSlot("xhrRequestHistory", null);
            slot.setSlotType("Array");
            slot.setShouldStoreSlot(false);
        }

        /**
     * @member {AiChatModel} model - The model the request is for.
     */
        {
            const slot = this.newSlot("chatModel", null);
            slot.setSlotType("AiChatModel");
        }

        /**
     * @member {Boolean} needsProxy - Whether the request needs a proxy.
     */
        {
            const slot = this.newSlot("needsProxy", true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
            slot.setDuplicateOp("duplicate");
            slot.setInspectorPath(this.svType());
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setSyncsToView(true);
        }

        /**
     * @member {Object} bodyJson - Contains the model choice and messages.
     */
        {
            const slot = this.newSlot("bodyJson", null);
            slot.setSlotType("JSON Object");
            slot.setShouldStoreSlot(true);
        }

        /**
     * @member {String} body - The request body as a string.
     */
        {
            const slot = this.newSlot("body", null);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
            slot.setInspectorPath(this.svType() + "/body");
            slot.setIsSubnodeField(true);
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
        }

        /**
     * @member {Object} json - The request body as a JSON object.
     */
        {
            const slot = this.newSlot("json", null);
            slot.setSlotType("JSON Object");
        }


        /**
     * @member {Boolean} isStreaming - Whether the request is streaming.
     */
        {
            const slot = this.newSlot("isStreaming", false);
            slot.setInspectorPath(this.svType());
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
        }

        /**
     * @member {Promise} xhrPromise - The promise for the XMLHttpRequest.
     */
        {
            const slot = this.newSlot("xhrPromise", null);
            slot.setSlotType("Promise");
        }

        /**
     * @member {String} requestId - The request ID.
     */
        {
            const slot = this.newSlot("requestId", null);
            slot.setInspectorPath(this.svType());
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {Number} readIndex - Current read index in the responseText.
     */
        {
            const slot = this.newSlot("readIndex", 0);
            slot.setInspectorPath(this.svType());
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {Array} readLines - The lines read from the responseText.
     */
        {
            const slot = this.newSlot("readLines", null);
            slot.setSlotType("Array");
        }

        /**
     * @member {Boolean} isContinuation - Whether the request is a continuation.
     */
        {
            const slot = this.newSlot("isContinuation", false);
            slot.setInspectorPath(this.svType());
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {Number} continuationStartIndex - Where the continued request started in the fullContext (not the responseText).
     */
        {
            const slot = this.newSlot("continuationStartIndex", 0);
            slot.setInspectorPath(this.svType());
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {String} stopReason - The reason the request stopped.
     */
        {
            const slot = this.newSlot("stopReason", null);
            slot.setInspectorPath(this.svType());
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {Number} retryDelaySeconds - The delay before retrying the request.
     */
        {
            const slot = this.newSlot("retryDelaySeconds", 1);
            slot.setInspectorPath(this.svType());
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {String} fullContent - The full content of the response.
     */
        {
            const slot = this.newSlot("fullContent", null);
            slot.setInspectorPath(this.svType() + "/fullContent");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {Error} error - The error object.
     */
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }

        /**
     * @member {Error} stopError - The error object.
     */
        {
            const slot = this.newSlot("stopError", null);
            slot.setSlotType("Error");
        }

        /**
     * @member {String} status - The status of the request.
     */
        {
            const slot = this.newSlot("status", "");
            slot.setInspectorPath(this.svType());
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {Boolean} didAbort - Whether the request was aborted.
     */
        {
            const slot = this.newSlot("didAbort", false);
            slot.setInspectorPath(this.svType());
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
            slot.setCanEditInspection(false);
        }

        /**
     * @member {Action} retryRequestAction - The action to retry the request.
     */
        {
            const slot = this.newSlot("retryRequestAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Retry Request");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("retryRequest");
        }

        /**
     * @member {Action} copyBodyAction - The action to copy the request body.
     */
        {
            const slot = this.newSlot("copyBodyAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Copy Body");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("copyBody");
        }

        /**
     * @member {Action} copyMessagesAction - The action to copy the messages.
     */
        {
            const slot = this.newSlot("copyMessagesAction", null);
            slot.setInspectorPath("");
            slot.setLabel("Copy Messages");
            slot.setSyncsToView(true);
            slot.setDuplicateOp("duplicate");
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("copyMessages");
        }

        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    /**
   * Initializes the AiRequest instance
   */
    init () {
        super.init();
        this.setIsDebugging(false);
        this.setRequestId(this.puuid());
        this.setTitle("Request");
        this.setXhrRequestHistory([]);
        this.setIsDebugging(true);
    }

    // --- helper accessors ---

    service () {
        return this.chatModel().service();
    }

    // NOTE: it's not idea for the AiRequest to know about the ConversationMessage or Conversation class
    // TODO: refactor this later so the prepareToSendRequest() method somehow get the messaage reference
    message () {
        const delegate = this.delegate();
        if (delegate && delegate.isKindOf(ConversationMessage)) {
            return delegate;
        }
        return null;
    }

    conversation () {
        const message = this.message();
        if (message) {
            return message.conversation();
        }
        return null;
    }

    /**
   * Returns the subtitle for the request
   * @returns {string}
   */
    subtitle () {
        const content = this.fullContent();
        const length = content ? content.length : 0;
        return [length + " bytes", this.status()].join("\n");
    }

    /**
   * @category Login
   * @description Returns the API URL
   * @returns {string}
   */
    apiUrl () {
        return this.service().chatEndpoint();
    }

    /**
   * @category Login
   * @description Returns the API key
   * @returns {Promise<string>}
   */
    async apiKeyOrUserAuthToken () {
        return await this.service().apiKeyOrUserAuthToken();
    }

    /**
   * Returns the request body
   * @returns {string}
   */
    body () {
        return JSON.stringify(this.bodyJson(), null, 2);
    }

    /**
   * Returns the request options
   * @returns {Promise<Object>}
   */
    async requestOptions () {
        const apiKey = await this.apiKeyOrUserAuthToken();
        const json = {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Bearer ${apiKey}`,
                "Accept-Encoding": "identity"
            },
            body: this.body()
        };

        const extraHeaders = this.chatModel().extraHeaders();
        if (extraHeaders) {
            Object.keys(extraHeaders).forEach((key) => {
                json.headers[key] = extraHeaders[key];
            });
        }


        return json;
    }

    /**
   * Asserts that the request is valid
   */
    async assertValid () {
        if (!this.apiUrl()) {
            throw new Error(this.svType() + " apiUrl missing");
        }

        const token = await this.apiKeyOrUserAuthToken();
        if (!token) {
            throw new Error(this.svType() + " apiKeyOrUserAuthToken missing");
        }
    }

    /**
   * Returns the underlying XMLHttpRequest object from the current XHR request
   * @returns {XMLHttpRequest}
   */
    xhr () {
        const xhrRequest = this.currentXhrRequest();
        return xhrRequest ? xhrRequest.xhr() : null;
    }

    /**
   * Returns the active API URL
   * @returns {Promise<string>|string}
   */
    async activeApiUrl () {
        let url;
        // Check if subclass has async getApiUrl method
        if (this.getApiUrl) {
            url = await this.getApiUrl();
        } else {
            url = this.apiUrl();
        }
        if (this.needsProxy()) {
            url = ProxyServers.shared().defaultServer().proxyUrlForUrl(url);
        }
        return url;
    }

    /**
   * Returns the proxy URL
   * @returns {string}
   */
    proxyUrl () {
        const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(this.url());
        return proxyUrl;
    }

    /**
   * Displays the request details
   */
    showRequest () {
        this.logDebug(this.description());
    }

    /**
   * Displays the response details
   */
    showResponse () {
        const json = this.json();
        this.logDebug(" response json: ", json);
        if (json.error) {
            console.error(this.logPrefix(), json.error.message);
        }
    }

    /**
   * Returns a description of the response size
   * @returns {string}
   */
    responseSizeDescription () {
    // For streaming, use fullContent if available, otherwise get from current XHR
        if (this.fullContent()) {
            return ByteFormatter.clone().setValue(this.fullContent().length).formattedValue();
        }
        const xhr = this.currentXhrRequest();
        if (xhr) {
            return ByteFormatter.clone().setValue(xhr.contentByteCount()).formattedValue();
        }
        return ByteFormatter.clone().setValue(0).formattedValue();
    }

    /**
   * Returns the curl command for the request
   * @returns {string}
   */
    curlCommand () {
        const commandParts = [];
        commandParts.push("curl  --insecure \"" + this.activeApiUrl() + '"');
        const headers = this.requestOptions().headers;

        Object.keys(headers).forEach((key) => {
            const value = headers[key];
            commandParts.push(` --header "${key}: ${value}"`);
        });

        const data = JSON.stringify(this.bodyJson());
        commandParts.push(" --data '" + data + "'");
        return commandParts.join(" \\\n");
    }

    /**
   * Returns a description of the request
   * @returns {string}
   */
    description () {
        const json = {
            requestId: this.requestId(),
            options: this.requestOptions(),
            activeApiUrl:  this.activeApiUrl(),
            apiUrl:  this.apiUrl()
            //body: this.bodyJson()
        };
        if (json.options.body) {
            json.options.body = json.options.body.substring(0, 200) + "..."; // cut off at 200 characters
        }
        return JSON.stringify(json, null, 2);
    }

    /**
   * Asserts that the request is ready to stream
   */
    assertReadyToStream () {
        const target = this.delegate();
        if (target) {
            assert(target.onStreamStart);
            assert(target.onStreamData);
            assert(target.onStreamEnd);
        }
    }

    /**
   * Sets up the request for streaming
   * @returns {AiRequest}
   */
    setupForStreaming () {
        return this;
    }

    /**
   * Sends the request and streams the response
   * @returns {Promise}
   */

    async asyncSendAndStreamResponse () {

        if (this.isContinuation()) {
            //this.logDebug(" asyncSendAndStreamResponse() isContinuation");
        }

        this.service().prepareToSendRequest(this); // give anthropic a chance to ensure alternating user/assistant messages

        this.setError(null); // clear error (in case we are retrying)
        assert(!this.currentXhrRequest());

        if (!this.isContinuation()) {
            assert(!this.xhrPromise());
            this.setXhrPromise(Promise.clone());
        }

        this.assertValid();
        this.assertReadyToStream();

        //this.logDebug("--- URL ---\n", this.activeApiUrl(), "\n-----------");
        //this.logDebug("--- CURL ---\n", this.curlCommand(), "\n-----------");


        this.setIsStreaming(true);
        this.setStatus("streaming");

        this.setupForStreaming();
        this.setReadLines([]);

        // Create a new SvXhrRequest for this request
        const xhrRequest = SvXhrRequest.clone();
        this.setCurrentXhrRequest(xhrRequest);
        this.xhrRequestHistory().push(xhrRequest);

        // Get request options and URL asynchronously
        const requestOptions = await this.requestOptions();
        const apiUrl = await this.activeApiUrl();

        // Configure the XHR request
        xhrRequest.setUrl(apiUrl);
        xhrRequest.setMethod("POST");
        xhrRequest.setRequestOptions(requestOptions);
        xhrRequest.setResponseType(""); // "" or "text" is required for streams

        // Set this as the delegate to receive callbacks
        xhrRequest.setDelegate(this);

        // let's print the url and headers here to the console
        this.logDebug(`API Request - model: ${this.chatModel().title()}, url: ${apiUrl}, headers:`, requestOptions.headers);

        if (!this.isContinuation()) {
            this.setFullContent("");
        }

        if (!this.isContinuation()) {
            this.sendDelegateMessage("onRequestBegin");
            this.sendDelegateMessage("onStreamStart");
        }

        // Send the request
        await xhrRequest.asyncSend();

        return this.xhrPromise();
    }

    /**
   * @category Delegate callbacks from SvXhrRequest
   * @description Called when the XHR request makes progress
   * @param {SvXhrRequest} request
   */
    onRequestProgress (/*request*/) {
    // For streaming, we need to read the partial response
        this.onXhrRead();
    }

    /**
   * @category Delegate callbacks from SvXhrRequest
   * @description Called when the XHR request completes successfully
   * @param {SvXhrRequest} request
   */
    onRequestSuccess (/*request*/) {
    // Finish reading any remaining lines
        this.readXhrLines();

        if (this.stoppedDueToMaxTokens()) {
            // continue with another request
            this.continueRequest();
            return;
        } else if (this.stopError()) {
            if (!this.error()) {
                // we don't want to overwrite a custom error if it's already set
                this.onError(this.stopError());
            }
            return;
        }

        this.sendDelegateMessage("onStreamEnd");
        this.sendDelegateMessage("onRequestComplete");

        this.setStatus("completed " + this.responseSizeDescription());
        this.xhrPromise().callResolveFunc(this.fullContent());

        console.log(this.logPrefix(), " request completed");
    }

    /**
   * @category Delegate callbacks from SvXhrRequest
   * @description Called when the XHR request fails
   * @param {SvXhrRequest} request
   */
    onRequestFailure (request) {
        const xhr = request.xhr();
        console.log(this.logPrefix(), this.description());

        // Try to parse error from response
        const responseText = request.responseText();
        if (responseText && responseText !== "[Binary blob data]" && responseText !== "[Binary array buffer]") {
            try {
                const json = JSON.parse(responseText);
                if (json.error) {
                    let msg = null;
                    if (Type.isString(json.error)) {
                        msg = json.error;
                    } else if (Type.isString(json.error.message)) {
                        msg = json.error.message;
                    } else {
                        msg = JSON.stringify(json.error, null, 2);
                    }
                    this.onError(new Error(msg));
                    return;
                }
            } catch (e) {
                console.log(this.logPrefix(), "onRequestFailure: error parsing json: " + e);
                // Not JSON, use status code error
            }
        }

        this.onError(new Error("request error code: " + xhr.status));
    }

    /**
   * @category XHR
   * @description Returns the continue message
   * @returns {Object}
   */
    continueMessage () {
        return {
            role: "user",
            content: `Your last request was truncated due to the response size limit. 
      Please continue exactly where you left off. 
      I will paste this message at the end of your last message in the conversation so it is critical that you continue exactly where you left off, so do not add any comments about the fact that you are continuing the prior response.
      Such comments would break any structured data, such as JSON, that is being returned.`
        };
    }

    /**
   * @category XHR
   * @description Returns the response message
   * @returns {Object}
   */
    responseMessage () {
        return {
            role: "assistant",
            content: this.fullContent()
        };
    }

    /**
   * @category XHR
   * @description Returns true if the last message is a continue request
   * @returns {boolean}
   */
    lastMessageIsContinueRequest () {
        const messages = this.bodyJson().messages;
        const lastMessage = messages.last();
        // continueMessage is the user request for the ai to continue it's last message
        return lastMessage && lastMessage.content === this.continueMessage().content;
    }

    /**
   * @category XHR
   * @description Retries the request
   */
    retryRequest () {
        this.setError(null);
        this.setFullContent(this.fullContent().substring(0, this.continuationStartIndex()));
        this.setCurrentXhrRequest(null);
        // TODO need to track where coninutation read index was
        this.setReadIndex(0); // this is the read index on the new xhr responseText, not the AiRequest fullContent
        this.setStopReason(null);
        this.setStatus("retrying");
        this.setXhrPromise(null);
        this.asyncSendAndStreamResponse();
    }

    /**
   * @category XHR
   * @description Copies the body to the clipboard
   * @returns {AiRequest}
   */
    copyBody () {
        this.body().copyToClipboard();
        return this;
    }

    /**
   * @category XHR
   * @description Copies the messages to the clipboard
   * @returns {AiRequest}
   */
    copyMessages () {
        const messages = this.bodyJson().messages;
        const content = JSON.stringify(messages, null, 2);
        content.copyToClipboard();
        return this;
    }

    /**
   * @category XHR
   * @description Continues the request
   */
    continueRequest () {
        this.logDivider(" continueRequest()");
        const lastBit = this.fullContent().slice(-100);
        console.log(this.logPrefix(), "continuing lastBit: [[[" + lastBit + "]]]");
        // add a continue message to the end of the messages array if needed
        //if (this.lastMessageIsContinueRequest()) {
        const messages = this.bodyJson().messages;
        this.setContinuationStartIndex(this.fullContent().length); // clip back to here if we retry the new request
        if (this.isContinuation()) {
            messages.secondToLast().content += this.fullContent();
        } else {
            messages.push(this.responseMessage());
            messages.push(this.continueMessage());
        }

        // clear request state except fullContent
        this.setCurrentXhrRequest(null);
        this.setReadIndex(0); // this is the read index on the responseText, not the fullContent
        this.setStopReason(null);
        this.setStatus("continuing");


        this.setIsContinuation(true); // so the fullContent isn't cleared
        // send request again to continue where we left off
        this.asyncSendAndStreamResponse();
    }

    /**
   * @description Called when the error slot is updated
   * @param {Error} oldValue
   * @param {Error} newValue
   */
    didUpdateSlotError (oldValue, newValue) {
    //debugger
        if (newValue) {
            this.setStatus("ERROR: " + newValue.message);
        }
    }

    /**
   * @description Retries the request with a delay
   * @param {number} seconds
   */
    retryWithDelay (seconds) {
        console.log(this.logPrefix(), " retrying in " + seconds + " seconds");
        this.addTimeout(() => {
            this.retryRequest();
        }, seconds * 1000);
    }


    /**
   * @description Called when the error slot is updated
   * @param {Error} e
   */
    onError (e) {
        this.setError(e);

        if (this.isRecoverableError()) {
            const d = this.retryDelaySeconds();
            const f = 2; // exponential backoff factor
            const nd = (d * f).randomBetween(d * f * f); // random spot between the next two exponential points
            this.retryWithDelay(nd);
            this.setRetryDelaySeconds(nd);
            const ts = TimePeriodFormatter.clone().setValueInSeconds(nd).formattedValue();
            e.message = this.service().title() + " overloaded, retrying in " + ts;
        }

        console.error(this.logPrefix(), e.message);
        this.sendDelegateMessage("onRequestError", [this, e]);
        return this;
    }

    /**
   * @category Delegate callbacks from SvXhrRequest
   * @description Called when the XHR request encounters an error
   * @param {SvXhrRequest} request
   * @param {Error} error
   */
    onRequestError (request, error) {
        console.error(this.logPrefix(), "onRequestError:", error);
        this.onError(error);
        this.sendDelegateMessage("onStreamEnd");
        this.xhrPromise().callRejectFunc(error);
    }


    /**
   * @category Delegate callbacks from SvXhrRequest
   * @description Called when the XHR request is aborted
   * @param {SvXhrRequest} request
   */
    onRequestAbort (/*request*/) {
        this.setDidAbort(true);
        this.setStatus("aborted");
        this.sendDelegateMessage("onStreamEnd");
        //this.sendDelegateMessage("onStreamAbort");
        this.xhrPromise().callRejectFunc(new Error("aborted"));
    }

    /**
   * @category Delegate callbacks from SvXhrRequest
   * @description Called when the XHR request completes (success, failure, or abort)
   * @param {SvXhrRequest} request
   */
    onRequestComplete (request) {
    // Clean up the current request reference if it matches
        if (this.currentXhrRequest() === request) {
            this.setCurrentXhrRequest(null);
        }
    }

    /**
   * @category XHR
   * @description Returns the unread response
   * @returns {string}
   */
    unreadResponse () {
        const xhrRequest = this.currentXhrRequest();
        if (!xhrRequest) {
            return "";
        }
        const responseText = xhrRequest.responseText();
        if (!responseText || responseText === "[Binary blob data]" || responseText === "[Binary array buffer]") {
            return "";
        }
        const unread = responseText.substr(this.readIndex());
        return unread;
    }

    /**
   * @category XHR
   * @description Reads the remaining response
   * @returns {string}
   */
    readRemaining () {
        const xhrRequest = this.currentXhrRequest();
        if (!xhrRequest) {
            return undefined;
        }
        const responseText = xhrRequest.responseText();
        if (!responseText || responseText === "[Binary blob data]" || responseText === "[Binary array buffer]") {
            return undefined;
        }

        if (this.readIndex() >= responseText.length) {
            return undefined;
        }

        const newLineIndex = responseText.length;
        const newLine = responseText.substring(this.readIndex(), newLineIndex);
        this.setReadIndex(newLineIndex); // advance the read index
        return newLine;
    }

    /**
   * @category XHR
   * @description Reads the next line from the XHR response
   * @returns {string}
   */
    readNextXhrLine () {
        const xhrRequest = this.currentXhrRequest();
        if (!xhrRequest) {
            return undefined;
        }
        const responseText = xhrRequest.responseText();
        if (!responseText || responseText === "[Binary blob data]" || responseText === "[Binary array buffer]") {
            return undefined;
        }

        const newLineIndex = responseText.indexOf("\n", this.readIndex());

        if (newLineIndex === -1) {
            return undefined; // no new line found
        }

        const newLine = responseText.substring(this.readIndex(), newLineIndex);

        /*
    console.log(this.logPrefix(), "responseText: [" + responseText + "]");
    console.log(this.logPrefix(), "indexes: " + this.readIndex() + " -> " + newLineIndex);
    console.log(this.logPrefix(), "newLine: [" + newLine + "]");
    */
        this.setReadIndex(newLineIndex + 1); // advance the read index

        return newLine;
    }

    /**
   * @category XHR
   * @description Called when the XHR read event is fired
   */
    onXhrRead () {
        this.readXhrLines();
    }

    /**
   * @category XHR
   * @description Reads the lines from the XHR response
   */
    readXhrLines () {
        throw new Error(this.svType() + " readXhrLines not implemented");
    }

    /**
   * @category XHR
   * @description Called when a JSON chunk is streamed
   * @param {Object} json
   */
    onStreamJsonChunk (/*json*/) {
        throw new Error(this.svType() + " onStreamJsonChunk not implemented");
    }

    /**
   * @category XHR
   * @description Returns true if the request is active
   * @returns {boolean}
   */
    isActive () {
        const xhrRequest = this.currentXhrRequest();
        return xhrRequest ? xhrRequest.isActive() : false;
    }

    /**
   * @category XHR
   * @description Aborts the request
   * @returns {AiRequest}
   */
    abort () {
        const xhrRequest = this.currentXhrRequest();
        if (xhrRequest) {
            xhrRequest.abort();
        }
        return this;
    }

    /**
   * @category XHR
   * @description Shuts down the request
   * @returns {AiRequest}
   */
    shutdown () {
        this.abort();
        return this;
    }

    /**
   * @category XHR
   * @description Called when new content is received
   * @param {string} newContent
   */
    onNewContent (newContent) {
    //console.log(this.logPrefix(), this.svTypeId() + ".onNewContent(`" + newContent + "`)");
        this.setFullContent(this.fullContent() + newContent);
        this.sendDelegateMessage("onStreamData", [this, newContent]);
    }

    // --- stopping ---

    /**
   * @category Stopping
   * @description Returns the ok stop reasons
   * @returns {Array}
   */
    okStopReasons () {
        return [null];
    }

    /**
   * @category Stopping
   * @description Returns true if the stop reason is an error
   * @returns {boolean}
   */
    hasStopError () {
        return !this.okStopReasons().includes(this.stopReason());
    }

    /**
   * @category Stopping
   * @description Returns the stop error
   * @returns {Error}
   */
    stopError () {
        if (this.hasStopError()) {
            return new Error(this.stopReasonDescription());
        }
        return null;
    }

    /**
   * @category Stopping
   * @description Returns the stop reason dictionary
   * @returns {Object}
   */
    stopReasonDict () {
        return new Error(this.svType() + " stopReasonDict not implemented");
    }

    /**
   * @category Stopping
   * @description Returns the stop reason description
   * @returns {string}
   */
    stopReasonDescription () {
        const reason = this.stopReason();
        const dict = this.stopReasonDict();
        return dict[reason];
    }

    /**
   * @category Stopping
   * @description Returns true if the request was stopped due to max tokens
   * @returns {boolean}
   */
    stoppedDueToMaxTokens () {
        throw new Error(this.svType() + " stoppedDueToMaxTokens not implemented");
    }

    /**
   * @category Stopping
   * @description Returns the retriable stop reasons
   * @returns {Set}
   */
    retriableStopReasons () {
        return new Set(["overloaded_error"]);
    }

    /**
   * @category Stopping
   * @description Returns true if the error is recoverable
   * @returns {boolean}
   */
    isRecoverableError () {
        const e = this.error();
        if (e) {
            return this.retriableStopReasons().has(e.name);
        }
        return false;
    }

}).initThisClass();
