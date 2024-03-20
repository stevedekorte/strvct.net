"use strict";

/* 
    XhrWrapper

    Wrapper for request to API
    delegate methods:

    onRequestBegin(request)
    onRequestRead(request)
    onRequestComplete(request)
    onRequestError(request, error)
    onRequestAbort(request)

    onStreamStart(request)
    onStreamData(request, newContent)
    onStreamEnd(request)

    delegate can get info via: 
      request.fullContent() 
      request.status()
      request.error()

*/

(class XhrWrapper extends BMStorableNode {

  initPrototypeSlots() {
    {
      const slot = this.newSlot("delegate", null); // optional ref
    }

    {
      const slot = this.newSlot("url", null);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("needsProxy", true);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }


    {
      const slot = this.newSlot("method", "POST");
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("headers", null);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Pointer");
      slot.setIsSubnodeField(false);
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("requestOptions", null); // this will contain the model choice and messages
    }

    {
      const slot = this.newSlot("body", null); 
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
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
    this.setRequesstOptions({
      method:"POST",
      headers: {
      },
      body: ""
    });
    this.setTitle(this.type());
    this.setIsDebugging(true);
  }

  subtitle () {
    return this.status();
  }

  // --- options ---

  requestOptions () {
    return {
      method: this.method(),
      headers: this.headers(),
      body: this.body()
    };
  }

  // ----------------------------

  assertValidUrl () {
    if (!this.url()) {
      throw new Error(this.type() + " url missing");
    }
  }

  activeUrl () {
    const url = this.url();
    if (this.needsProxy()) {
      return ProxyServers.shared().defaultServer().proxyUrlForUrl(url);
    }
    return url;
  }

  proxyUrl () {
    const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(this.url());
    return proxyUrl;
  }

  showRequest () {
    this.debugLog(this.description());
  }

  showResponse () {
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
    commandParts.push(`curl  --insecure "` + this.activeUrl() + '"');
    const headers = this.requestOptions().headers;

     Object.keys(headers).forEach((key) => {
      const value = headers[key];
      commandParts.push(` --header "${key}: ${value}"`);
    });

    // TODO: deal with binary body data
    commandParts.push(` --data '` + this.body() + `'`);
    return commandParts.join(" \\\n");
  }

  description () {
    const json = {
      requestId: this.requestId(),
      options: this.requestOptions(),
      url:  this.url(),
      activeUrl: this.activeUrl(),
      body: this.body()
    };
    return JSON.stringify(json, 2, 2);
  }

  // --- streaming response --- 

  assertValidDelegate () {
    const d = this.delegate();
    if (d) {
      assert(d.onStreamStart);
      assert(d.onStreamData);
      assert(d.onStreamEnd);
    }
  }

  async send () {
    assert(!this.xhrPromise());

    this.setXhrPromise(Promise.clone());

    this.assertValidUrl();
    assert(!this.xhr(), "xhr should be null");

    this.assertValidDelegate();

    this.setIsStreaming(true);
    this.setStatus("streaming");

    const xhr = new XMLHttpRequest();
    this.setXhr(xhr);
    xhr.open(this.method(), this.activeUrl());

    // set headers
    const options = this.requestOptions();
    
    const headers = this.headers();
    for (const k in headers) {
      const v = headers[header];
      xhr.setRequestHeader(k, v);
    }

    xhr.responseType = ""; // "" or "text" is required for streams

    this.setFullContent("");

    // TODO: move to a standard wrapped XHR class?
    
    // why false arg? see https://stackoverflow.com/questions/51204603/read-response-stream-via-xmlhttprequest
    xhr.addEventListener("progress", (event) => {
      EventManager.shared().safeWrapEvent(() => { 
        this.onXhrProgress(event) 
      }, event)
    }, false);

    xhr.addEventListener("loadend", (event) => {
      try { 
        EventManager.shared().safeWrapEvent(() => { 
          this.onXhrLoadEnd(event) 
        }, event);
      } catch (error) {
       this.onError(error); 
      }
    });

    xhr.addEventListener("error", (event) => {
      EventManager.shared().safeWrapEvent(() => { 
        this.onXhrError(event) 
      }, event)
    });

    xhr.addEventListener("abort", (event) => {
      EventManager.shared().safeWrapEvent(() => { 
        this.onXhrAbort(event) 
      }, event)
    });

    this.sendDelegate("onRequestBegin");
    this.sendDelegate("onStreamStart");

    xhr.send(this.body());

    return this.xhrPromise();
  }

  // --- xhr request event handlers ---

  onXhrProgress (event) {
    //console.log(this.typeId() + " onXhrProgress() bytes " + this.fullContent().length);
    this.onXhrRead();
    this.sendDelegate("onRequestRead");
  }

  statusCode () {
    return this.xhr().status;
  }

  onXhrLoadEnd (event) {
    //console.log(this.typeId() + " onXhrLoadEnd() bytes [[" + this.fullContent() + "]]");
    //const hasError = this.xhr().status >= 300;

    this.sendDelegate("onStreamEnd"); // all data chunks should have already been sent via onStreamData
    this.sendDelegate("onRequestComplete");
    this.setStatus("completed " + this.responseSizeDescription());
    this.xhrPromise().callResolveFunc(this.fullContent()); 

    console.log(this.typeId() + " onXhrLoadEnd()");
  }

  onXhrError (event) {
    const xhr = this.xhr();
    // error events don't contain messages - need to look at xhr and guess at what happened
    //let s = "Error on Xhr requestId " + this.requestId() + " ";
    let s = "Xhr error: " + this.description() + " ";
    s += " status: " + this.nameForXhrStatusCode(xhr.status); // e.g. 404 = file not found
    s += ", statusText: '" + xhr.statusText + "'";
    s += ", readyState: " + this.nameForXhrReadyState(xhr.readyState); // e.g.. 4 === DONE
    const error = new Error(s);
    this.onError(error);
    this.sendDelegate("onStreamError", [this, error]);
    this.sendDelegate("onStreamEnd");
    this.xhrPromise().callRejectFunc(error);
  }

  onXhrAbort (event) {
    this.setStatus("aborted")
    this.sendDelegate("onRequestComplete");
    this.sendDelegate("onStreamEnd");
    this.xhrPromise().callRejectFunc(new Error("aborted"));
  }

  onXhrRead () {
    //this.sendDelegate("onStreamData", [this, this.fullContent()]);
    //this.readXhrLines()
  }

  // --- error ---

  didUpdateSlotError (oldValue, newValue) {
    if (newValue) {
      this.setStatus("ERROR: " + newValue.message)
    }
  }

  onError (e) {
    this.setError(e);
    this.sendDelegate("onRequestError", [this, e])

    if (e) {
      console.warn(this.debugTypeId() + " " + e.message);
    }
    return this;
  }

  // --- abort ---

  isActive () {
    const xhr = this.xhr();
    if (xhr) {
      const state = xhr.readyState;
      return (state >= 1 && state <= 3);
    }
    return false;
  }
  
  abort () {
    if (this.isActive()) {
      this.xhr().abort();
    }
    return this;
  }

  // --- delegate ---

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

  // --- helpers ---

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

}).initThisClass();
