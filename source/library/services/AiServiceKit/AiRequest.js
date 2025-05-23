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

  /**
   * Test static method.
   */
  static testStaticMethod () {
    console.log("testStaticMethod");
  }

  initPrototypeSlots () {
    /**
     * @member {Object} delegate - Optional reference to object that owns request
     */
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
    }

    /**
     * @member {AiService} service - The service the request is for.
     */
    {
      const slot = this.newSlot("service", null);
      slot.setSlotType("AiService");
    }

    /**
     * @member {AiChatModel} model - The model the request is for.
     */
    {
      const slot = this.newSlot("model", null);
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
      slot.setInspectorPath(this.type());
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
      slot.setInspectorPath(this.type() + "/body");
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
     * @member {XMLHttpRequest} xhr - The XMLHttpRequest object.
     */
    {
      const slot = this.newSlot("xhr", null);
      slot.setSlotType("XMLHttpRequest");
    }

    /**
     * @member {Boolean} isStreaming - Whether the request is streaming.
     */
    {
      const slot = this.newSlot("isStreaming", false);
      slot.setInspectorPath(this.type());
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
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
      slot.setInspectorPath(this.type());
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
      slot.setInspectorPath(this.type());
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
      slot.setInspectorPath(this.type());
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
      slot.setInspectorPath(this.type());
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
      slot.setInspectorPath(this.type());
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
      slot.setInspectorPath(this.type());
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
      slot.setInspectorPath(this.type() + "/fullContent");
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
      slot.setInspectorPath(this.type());
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
      slot.setInspectorPath(this.type());
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
    this.setIsDebugging(true);
  }

  /**
   * Returns the subtitle for the request
   * @returns {string}
   */
  subtitle () {
    return [this.fullContent().length + " bytes", this.status()].join("\n");
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
   * @returns {string}
   */
  apiKeyOrUserAuthToken () {
    return this.service().apiKeyOrUserAuthToken();
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
   * @returns {Object}
   */
  requestOptions () {
    const apiKey = this.apiKeyOrUserAuthToken();
    const json = {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Bearer ${apiKey}`,
        'Accept-Encoding': 'identity'
      },
      body: this.body()
    };

    const extraHeaders = this.model().extraHeaders();
    if (extraHeaders) {
      Object.keys(extraHeaders).forEach((key) => {
        json.headers[key] = extraHeaders[key];
      });
    }

    //debugger;
    return json;
  }

  /**
   * Asserts that the request is valid
   */
  assertValid () {
    if (!this.apiUrl()) {
      throw new Error(this.type() + " apiUrl missing");
    }

    if (!this.apiKeyOrUserAuthToken()) {
      throw new Error(this.type() + " apiKeyOrUserAuthToken missing");
    }
  }

  /**
   * Returns the active API URL
   * @returns {string}
   */
  activeApiUrl () {
    let url = this.apiUrl();
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
    this.debugLog(this.description());
  }

  /**
   * Displays the response details
   */
  showResponse () {
    const json = this.json();
    this.debugLog(" response json: ", json);
    if (json.error) {
      console.warn(this.type() + " ERROR:", json.error.message);
    }
  }

  /**
   * Returns a description of the response size
   * @returns {string}
   */
  responseSizeDescription () {
    const size = this.xhr() ? this.xhr().responseText.length : 0;
    return ByteFormatter.clone().setValue(size).formattedValue();
  }

  /**
   * Returns the curl command for the request
   * @returns {string}
   */
  curlCommand () {
    const commandParts = [];
    commandParts.push(`curl  --insecure "` + this.activeApiUrl() + '"');
    const headers = this.requestOptions().headers;

     Object.keys(headers).forEach((key) => {
      const value = headers[key];
      commandParts.push(` --header "${key}: ${value}"`);
    });

    const data = JSON.stringify(this.bodyJson());
    commandParts.push(` --data '` + data + `'`);
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
      //console.log(this.typeId() + " asyncSendAndStreamResponse() isContinuation");
    }

    this.service().prepareToSendRequest(this); // give anthropic a chance to ensure alternating user/assistant messages

    this.setError(null); // clear error (in case we are retrying)
    assert(!this.xhr());

    if (!this.isContinuation()) {
      assert(!this.xhrPromise());
      this.setXhrPromise(Promise.clone());
    }

    this.assertValid();
    this.assertReadyToStream();

    //console.log("--- URL ---\n", this.activeApiUrl(), "\n-----------");
    //console.log("--- CURL ---\n", this.curlCommand(), "\n-----------");

    //debugger;
    this.setIsStreaming(true);
    this.setStatus("streaming");

    this.setupForStreaming();
    this.setReadLines([]);

    const xhr = new XMLHttpRequest();
    this.setXhr(xhr);
    xhr.open("POST", this.activeApiUrl());

    // set headers
    const options = this.requestOptions();
    
    for (const header in options.headers) {
      const value = options.headers[header];
      xhr.setRequestHeader(header, value);
    }

    xhr.responseType = ""; // "" or "text" is required for streams

    if (!this.isContinuation()) {
      this.setFullContent("");
    }

    // TODO: move to a standard wrapped XHR class?
    
    // why false arg? see https://stackoverflow.com/questions/51204603/read-response-stream-via-xmlhttprequest
    xhr.addEventListener("progress", (event) => {
      EventManager.shared().safeWrapEvent(() => {
        this.onXhrProgress(event);
      }, event)
    }, false);

    xhr.addEventListener("loadend", (event) => {
      try { 
        EventManager.shared().safeWrapEvent(() => { 
          this.onXhrLoadEnd(event);
        }, event);
      } catch (error) {
       this.onError(error); 
      }
    });

    xhr.addEventListener("error", (event) => {
      EventManager.shared().safeWrapEvent(() => { 
        this.onXhrError(event);
      }, event)
    });

    xhr.addEventListener("abort", (event) => {
      EventManager.shared().safeWrapEvent(() => { 
        this.onXhrAbort(event);
      }, event)
    });

    //  EventManager.shared().safeWrapEvent(() => { ... })
    
    if (!this.isContinuation()) {
      this.sendDelegate("onRequestBegin");
      this.sendDelegate("onStreamStart");
    }

    //const s = JSON.stringify(options, null, 2);
    //this.debugLog("SENDING REQUEST BODY:", options.body);
    xhr.send(options.body);

    return this.xhrPromise();
  }

  /**
   * @category XHR
   * @description Called when the XHR progress event is fired
   * @param {ProgressEvent} event 
   */
  onXhrProgress (/*event*/) {
    /*
    const txt = event.currentTarget.responseText;
    const latestString = txt.substr(txt.length - event.loaded, event.loaded);
    console.log(this.typeId() + " onXhrProgress() read [" + latestString + "]");
    */
    //debugger;
    this.onXhrRead();

  }

  /**
   * @category XHR
   * @description Called when the XHR loadend event is fired
   * @param {Event} event 
   */
  onXhrLoadEnd (/*event*/) {
    if (this.didAbort()) {
      return;
    }
    //console.log(this.typeId() + " onXhrLoadEnd() bytes [[" + this.fullContent() + "]]");

    //debugger
    const isError = this.xhr().status >= 300
    if (isError) {
      console.log(this.description());
      console.error(this.xhr().responseText);
      const json = JSON.parse(this.xhr().responseText);
      if (json.error) {
        this.onError(new Error(json.error.message));
      } else {
        this.onError(new Error("request error code:" + this.xhr().status + ")"));
      }
    } else {
      this.readXhrLines() // finish reading any remaining lines
    }


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
    this.sendDelegate("onStreamEnd");
    this.sendDelegate("onRequestComplete")

    this.setStatus("completed " + this.responseSizeDescription());
    this.xhrPromise().callResolveFunc(this.fullContent()); 

    console.log(this.typeId() + " onXhrLoadEnd()");

    //const completionDict = this.bodyJson();
    //console.log("completionDict.usage:", JSON.stringify(completionDict.usage, null, 2)); // no usage property!
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
    this.setXhr(null);
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
    console.log("========================================== " + this.typeId() + " continueRequest() =====================================");
    const lastBit = this.fullContent().slice(-100);
    console.log("continuing lastBit: [[[" + lastBit + "]]]");
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
    this.setXhr(null);
    this.setReadIndex(0); // this is the read index on the responseText, not the fullContent
    this.setStopReason(null);
    this.setStatus("continuing");

   // debugger;
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
      this.setStatus("ERROR: " + newValue.message)
    }
  }

  /**
   * @description Retries the request with a delay
   * @param {number} seconds 
   */
  retryWithDelay (seconds) {
    console.log(this.typeId() + " retrying in " + seconds + " seconds");
    this.addTimeout(() => { 
      this.retryRequest();
    }, seconds*1000);
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
      const nd = (d*f).randomBetween(d*f*f); // random spot between the next two exponential points
      this.retryWithDelay(nd);
      this.setRetryDelaySeconds(nd);
      const ts = TimePeriodFormatter.clone().setValueInSeconds(nd).formattedValue();
      e.message = this.service().title() + " overloaded, retrying in " + ts;
    }

    console.warn(" ======================= " + this.type() + " ERROR: " + e.message + " ======================= ");
    debugger;
    this.sendDelegate("onRequestError", [this, e]);

    if (e) {
      console.warn(this.debugTypeId() + " " + e.message);
    }
    return this;
  }

  /**
   * @category XHR
   * @description Called when the XHR error event is fired
   * @param {Event} event 
   */
  onXhrError (event) {
    debugger;
    const xhr = this.xhr();
    // error events don't contain messages - need to look at xhr and guess at what happened
    //let s = "Error on Xhr requestId " + this.requestId() + " ";
    let s = "Xhr error: " + this.description() + " ";
    s += " status: " + this.nameForXhrStatusCode(xhr.status); // e.g. 404 = file not found
    s += ", statusText: '" + xhr.statusText + "'";
    s += ", readyState: " + this.nameForXhrReadyState(xhr.readyState); // e.g.. 4 === DONE
    const error = new Error(s);
    this.onError(error);
    this.sendDelegate("onStreamEnd");
    this.xhrPromise().callRejectFunc(error);
  }

  /**
   * @category XHR
   * @description Returns a brief description of an XHR status code
   * @param {number} statusCode 
   * @returns {string}
   */
	nameForXhrStatusCode (statusCode) {
  /**
		   * This function returns a brief description of an XHR status code.
		   * 
		   * @param {number} statusCode - The XHR status code.
		   * @returns {string} - A brief description of the status, or "Unknown status".
		   */
	
		const xhrStatuses = {
      0: "Not started: Network Error, Request Blocked, or CORS issue",
      100: "Continue",
      101: "Switching protocols",
      200: "OK - Request successful",
      201: "Created - Resource created",
      301: "Moved permanently",
      304: "Not modified",
      400: "Bad request", 
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not found",
      500: "Internal server error" 
		};
	
		return statusCode + " (" + (xhrStatuses[statusCode] || "Unknown status") + ")";
  }

  /**
   * @category XHR
   * @description Returns a brief description of an XHR readyState
   * @param {number} readyState 
   * @returns {string}
   */
  nameForXhrReadyState (readyState) {
    /**
     * This function returns a brief description of an XHR readyState.
     * 
     * @param {number} readyState - The XHR readyState value.
     * @returns {string} - A brief description of the state, or "Unknown state".
     */

    const xhrStates = {
      0: "Request not initialized",
      1: "Server connection established",
      2: "Request received",
      3: "Processing request",
      4: "Request finished"
    };

    return status + " (" + (xhrStates[readyState] || "Unknown ready state") + ")";
  }

  /**
   * @category XHR
   * @description Called when the XHR abort event is fired
   * @param {Event} event 
   */
  onXhrAbort (/*event*/) {
    this.setDidAbort(true);
    this.setStatus("aborted");
    this.sendDelegate("onStreamEnd");
    //this.sendDelegate("onStreamAbort");
    this.xhrPromise().callRejectFunc(new Error("aborted"));
  }

  /**
   * @category XHR
   * @description Returns the unread response
   * @returns {string}
   */
  unreadResponse () {
    const unread = this.xhr().responseText.substr(this.readIndex());
    return unread
  }

  /**
   * @category XHR
   * @description Reads the remaining response
   * @returns {string}
   */
  readRemaining () {
    const responseText = this.xhr().responseText;

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
    const responseText = this.xhr().responseText;
    const newLineIndex = responseText.indexOf("\n", this.readIndex());
  
    if (newLineIndex === -1) {
      return undefined; // no new line found
    }
  
    const newLine = responseText.substring(this.readIndex(), newLineIndex);

    /*
    console.log("responseText: [" + responseText + "]");
    console.log("indexes: " + this.readIndex() + " -> " + newLineIndex);
    console.log("newLine: [" + newLine + "]");
    */
    this.setReadIndex(newLineIndex + 1); // advance the read index
  
    return newLine;
    }

  /**
   * @category XHR
   * @description Called when the XHR read event is fired
   */
  onXhrRead () {
    this.readXhrLines()
  }

  /**
   * @category XHR
   * @description Reads the lines from the XHR response
   */
  readXhrLines () {
    throw new Error(this.type() + " readXhrLines not implemented");
  }

  /**
   * @category XHR
   * @description Called when a JSON chunk is streamed
   * @param {Object} json 
   */
  onStreamJsonChunk (/*json*/) {
    throw new Error(this.type() + " onStreamJsonChunk not implemented");
  }

  /**
   * @category XHR
   * @description Returns true if the request is active
   * @returns {boolean}
   */
  isActive () {
    const xhr = this.xhr();
    if (xhr) {
      const state = xhr.readyState;
      return (state >= 1 && state <= 3);
    }
    return false;
  }
  
  /**
   * @category XHR
   * @description Aborts the request
   * @returns {AiRequest}
   */
  abort () {
    if (this.isActive()) {
      this.xhr().abort();
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
    //console.log(this.typeId() + ".onNewContent(`" + newContent + "`)");
    this.setFullContent(this.fullContent() + newContent);
    this.sendDelegate("onStreamData", [this, newContent]);
  }

  /**
   * @category XHR
   * @description Sends a delegate message
   * @param {string} methodName 
   * @param {Array} args 
   * @returns {boolean}
   */
  sendDelegate (methodName, args = [this]) {
    const d = this.delegate()
    if (d) {
      const f = d[methodName]
      if (f) {
        //this.debugLog(this.typeId() + " sending " + d.typeId() + "." + methodName + "(" + (args[1]? args[1] : "") + ")")
        f.apply(d, args)
        return true
      }
    }
    return false
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
    return new Error(this.type() + " stopReasonDict not implemented");
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
    throw new Error(this.type() + " stoppedDueToMaxTokens not implemented");
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
