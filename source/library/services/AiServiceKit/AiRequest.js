"use strict";

/* 
    AiRequest

    Wrapper for request to API service that manages streaming the response and checking for various errors.
    
    Delegate protocol:

      onRequestBegin(request)
      onRequestComplete(request)
      onRequestError(request, error)

      onStreamStart(request)
      onStreamData(request, newContent)
      onStreamEnd(request)

    Delegate can get info via:

      request.fullContent() 
      request.status()
      request.error()

*/

(class AiRequest extends BMStorableNode {

  initPrototypeSlots() {
    {
      const slot = this.newSlot("delegate", null); // optional reference to object that owns request - will receive onRequestComplete message if it responds to it
    }

    {
      const slot = this.newSlot("service", null); 
    }

    {
      const slot = this.newSlot("needsProxy", true);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("bodyJson", null); // this will contain the model choice and messages
    }

    {
      const slot = this.newSlot("body", null); 
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("json", null);
    }

    // fetching

    {
      const slot = this.newSlot("fetchPromise", null);
    }

    {
      const slot = this.newSlot("isFetchActive", false);
    }

    {
      const slot = this.newSlot("fetchAbortController", null);
    }

    // streaming

    {
      const slot = this.newSlot("isStreaming", false); // external read-only
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
    }

    {
      const slot = this.newSlot("streamTarget", null); // will receive onStreamData and onStreamEnd messages
    }

    {
      const slot = this.newSlot("xhr", null);
    }

    {
      const slot = this.newSlot("xhrPromise", null); 
    }

    {
      const slot = this.newSlot("requestId", null);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("readIndex", 0);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("readLines", null);
    }

    {
      const slot = this.newSlot("isContuation", false); // flag to skip "start" delegate message
    }

    {
      const slot = this.newSlot("stopReason", null);
    }

    {
      const slot = this.newSlot("fullContent", null); 
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("error", null);
    }

    {
      const slot = this.newSlot("status", "");
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    this.setShouldStore(false)
    this.setShouldStoreSubnodes(false)
  }


  init () {
    super.init();
    this.setIsDebugging(true);
    this.setRequestId(this.puuid());
    this.setTitle("Request");
    this.setIsDebugging(true);
  }

  subtitle () {
    return this.status();
  }

  // --- service properties ---

  apiUrl () {
    return this.service().chatEndpoint();
  }

  apiKey () {
    return this.service().apiKey();
  }

  // --- fetch ---

  body () {
    return JSON.stringify(this.bodyJson(), 2, 2);
  }

  requestOptions () {
    const apiKey = this.apiKey();
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        'Accept-Encoding': 'identity'
      },
      body: JSON.stringify(this.bodyJson())
    };
  }

  assertValid () {
    if (!this.apiUrl()) {
      throw new Error(this.type() + " apiUrl missing");
    }

    if (!this.apiKey()) {
      throw new Error(this.type() + " apiKey missing");
    }
  }

  activeApiUrl () {
    let url = this.apiUrl();
    if (this.needsProxy()) {
      url = ProxyServers.shared().defaultServer().proxyUrlForUrl(url);
    }
    return url;
  }

  proxyUrl () {
    const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(this.url());
    return proxyUrl;
    //return WebBrowserWindow.shared().rootUrl() + "/?proxyUrl=" + encodeURIComponent(this.url())
  }

  showRequest () {
    this.debugLog(this.description());
  }

  showResponse () {
    const json = this.json();
    this.debugLog(" response json: ", json);
    if (json.error) {
      console.warn(this.type() + " ERROR:", json.error.message);
    }
  }

  // --- normal response --- 

  responseSizeDescription () {
    const size = this.xhr() ? this.xhr().responseText.length : 0;
    return ByteFormatter.clone().setValue(size).formattedValue();
  }

  // --- helpers ---

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

  description () {
    const json = {
      requestId: this.requestId(),
      options: this.requestOptions(),
      activeApiUrl:  this.activeApiUrl(),
      apiUrl:  this.apiUrl(),
      body: this.bodyJson()
    };
    return JSON.stringify(json, 2, 2);
  }

  // --- streaming response --- 

  assertReadyToStream () {
    const target = this.streamTarget();
    if (target) {
      // verify streamTarget protocol is implemented by target
      assert(target.onStreamStart);
      assert(target.onStreamData);
      assert(target.onStreamEnd);
    }
  }

  setupForStreaming () {
    // subclasses should override this method to set up the request for streaming
    this.bodyJson().stream = true;
    return this;
  }

  async asyncSendAndStreamResponse () {

    this.service().prepareToSendRequest(this); // give anthropic a chance to ensure alternating user/assistant messages

    assert(!this.xhr());

    if (!this.isContuation()) {
      assert(!this.xhrPromise());
      this.setXhrPromise(Promise.clone());
    }

    this.assertValid();
    this.assertReadyToStream();

    //console.log("--- URL ---\n", this.activeApiUrl(), "\n-----------");
    //console.log("--- CURL ---\n", this.curlCommand(), "\n-----------");

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

    if (!this.isContuation()) {
      this.setFullContent("");
    }

    // TODO: move to a standard wrapped XHR class?
    
    // why false arg? see https://stackoverflow.com/questions/51204603/read-response-stream-via-xmlhttprequest
    xhr.addEventListener("progress", (event) => {
     EventManager.shared().safeWrapEvent(() => { this.onXhrProgress(event) }, event)
     //this.onXhrProgress(event)
    }, false);

    xhr.addEventListener("loadend", (event) => {
      try { 
        EventManager.shared().safeWrapEvent(() => { this.onXhrLoadEnd(event) }, event);
      } catch (error) {
       this.onError(error); 
      }
      //this.onXhrLoadEnd(event)
    });

    xhr.addEventListener("error", (event) => {
      EventManager.shared().safeWrapEvent(() => { this.onXhrError(event) }, event)
      //this.onXhrError(event)
    });

    xhr.addEventListener("abort", (event) => {
      EventManager.shared().safeWrapEvent(() => { this.onXhrAbort(event) }, event)
      //this.onXhrAbort(event)
    });

    //  EventManager.shared().safeWrapEvent(() => { ... })

    if (!this.isContuation()) {
      this.sendDelegate("onRequestBegin");
      this.streamTarget().onStreamStart(this);
    }

    //const s = JSON.stringify(options, 2, 2);
    //this.debugLog("SENDING REQUEST BODY:", options.body);
    xhr.send(options.body);

    return this.xhrPromise();
  }

  onXhrProgress (event) {
    //console.log(this.typeId() + " onXhrProgress() bytes " + this.fullContent().length);
    this.onXhrRead();
  }

  onXhrLoadEnd (event) {
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

    this.streamTarget().onStreamEnd(this); // all data chunks should have already been sent via onStreamData
    this.sendDelegate("onRequestComplete")

    if (this.stoppedDueToMaxTokens()) {
      // continue with another request
      this.requestContinuation();
      return;
    } else if (this.stopError()) {
      this.onError(this.stopError());
      return;
    }
    this.setStatus("completed " + this.responseSizeDescription());
    this.xhrPromise().callResolveFunc(this.fullContent()); 

    console.log(this.typeId() + " onXhrLoadEnd()");

    //const completionDict = this.bodyJson();
    //console.log("completionDict.usage:", JSON.stringify(completionDict.usage, 2, 2)); // no usage property!
  }

  continueMessage () {
    return { 
      role: "user", 
      content: "Your last request was truncated due to the response size limit. Please continue exactly where you left off."
    };
  }

  responseMessage () {
    return {
      role: "assistant",
      content: this.fullContent()
    }
  }

  lastMessageIsContinueRequest () {
    const messages = this.bodyJson().messages;
    const lastMessage = messages.last();
    return lastMessage && lastMessage.content === this.continueMessage().content;
  }

  requestContinuation () {
    console.log(this.typeId() + " requestContinuation() =====================================");
    // add a continue message to the end of the messages array if needed
    if (this.lastMessageIsContinueRequest()) {
      this.bodyJson().messages.secondToLast().content += this.fullContent();
    } else {
      this.bodyJson().messages.push(this.responseMessage());
      this.bodyJson().messages.push(this.continueMessage());
    }

    // clear request state except fullContent
    this.setXhr(null);
    this.setXhrPromise(null);
    this.setReadIndex(this.fullContent().length);
    this.setStopReason(null);
    this.setStatus("continuing");

    // send request again to continue where we left off
    this.asyncSendAndStreamResponse();
  }

  didUpdateSlotError (oldValue, newValue) {
    //debugger
    if (newValue) {
      this.setStatus("ERROR: " + newValue.message)
    }
  }

  onError (e) {
    //debugger
    this.setError(e);
    this.sendDelegate("onRequestError", [this, e])

    if (e) {
      console.warn(this.debugTypeId() + " " + e.message);
    }
    return this;
  }

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
    this.streamTarget().onStreamEnd(this);
    this.xhrPromise().callRejectFunc(error);
  }

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

  onXhrAbort (event) {
    this.setStatus("aborted")
    this.streamTarget().onStreamEnd(this);
    this.xhrPromise().callRejectFunc(new Error("aborted"));
  }

  unreadResponse () {
    const unread = this.xhr().responseText.substr(this.readIndex());
    return unread
  }

  readNextXhrLine () {
    const unread = this.unreadResponse();
    const newLineIndex = unread.indexOf("\n");

    if (newLineIndex === -1) {
      return undefined; // no new line found
    }

    let newLine = unread.substr(0, newLineIndex);
    this.setReadIndex(this.readIndex() + newLineIndex + 1); // advance the read index

    return newLine;
  }

  onXhrRead () {
    this.readXhrLines()
  }


  readXhrLines () {
    try {
      let line = this.readNextXhrLine();

      while (line !== undefined) {
        line = line.trim()
        if (line.length) {
          if (line.startsWith("data:")) {
            const s = line.after("data:");
            if (line.includes("[DONE]")) {
              // skip, stream is done and will close
              const errorFinishReasons = ["length", "stop"];
              if (errorFinishReasons.includes(this.stopReason())) {
                this.setError("finish reason: '" + this.stopReason() + "'");
              }
            } else {
              // we should expect json
              //console.log("LINE: " + s)
              const json = JSON.parse(s);
              this.onStreamJsonChunk(json);
            }
          } 
        }
        line = this.readNextXhrLine();
      }
    } catch (error) {
      this.onError(error);
      console.warn(this.type() + " ERROR:", error);
      this.xhrPromise().callRejectFunc(new Error(error));      
    }
  }

  onStreamJsonChunk (json) {
    if (json.error) {
      console.warn("ERROR: " + json.error.message);
      this.xhrPromise().callRejectFunc(new Error(json.error.message));
    } else if (
        json.choices &&
        json.choices.length > 0 &&
        json.choices[0].delta &&
        json.choices[0].delta.content
      ) {
        const newContent = json.choices[0].delta.content;
        this.setFullContent(this.fullContent() + newContent);
        this.streamTarget().onStreamData(this, newContent);
        //console.warn("CONTENT: ", newContent);
        this.setStopReason(json.choices[0].finish_reason);
    } else {
      if (json.id) {
        //console.warn("HEADER: ", JSON.stringify(json));
        // this is the header chunk - do we need to keep this around?
      } else {
        console.warn("WARNING: don't know what to do with this JsonChunk", json);
      }
    }
  }

  isActive () {
    const xhr = this.xhr();
    if (xhr) {
      const state = xhr.readyState;
      return (state >= 1 && state <= 3);
    }
    return false;
  }
  
  abort () {
    if (this.isFetchActive()) {
      if (this.fetchAbortController()) {
        this.fetchAbortController().abort();
      }
      return this;
    } 

    if (this.isActive()) {
      this.xhr().abort();
    }
    return this;
  }

  onNewContent (newContent) {
    this.setFullContent(this.fullContent() + newContent);
    this.streamTarget().onStreamData(this, newContent);
  }

  sendDelegate (methodName, args = [this]) {
    const d = this.delegate()
    if (d) {
      const f = d[methodName]
      if (f) {
        this.debugLog(this.typeId() + " sending " + d.typeId() + "." + methodName + "()")
        f.apply(d, args)
        return true
      }
    }
    return false
  }

  // --- stopping ---

  stopError () {
    if (this.stopReason() !== null) {
      return new Error(this.stopReasonDescription());
    }
    return null;
  }

  stopReasonDict () {
    return new Error(this.type() + " stopReasonDict not implemented");
  }

  stopReasonDescription () {
    const reason = this.stopReason();
    const dict = this.stopReasonDict();
    return dict[reason];
  }

  stoppedDueToMaxTokens () {
    throw new Error(this.type() + " stoppedDueToMaxTokens not implemented");
  }

}).initThisClass();
