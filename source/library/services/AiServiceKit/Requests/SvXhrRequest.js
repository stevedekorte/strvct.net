/**
 * @module library.services.AiServiceKit
 */

"use strict";

/**
 * @class SvXhrRequest
 * @extends SvStorableNode
 * @classdesc Wrapper for request to API service that manages streaming the response and checking for various errors.
 * 
 * Caller sets:
 *   - delegate
 *   - url
 *   - headers
 *   - body
 *   - json
 *   - isStreaming
 *   - requestId
 *   - retryDelaySeconds
 * 
 * Delegate protocol:
 * 
 *   onRequestBegin(request)
 *   onRequestProgress(request)
 * 
 *   onRequestSuccess(request)
 *   onRequestFailure(request)
 *   onRequestAbort(request)
 *   onRequestError(request, error)
 * 
 *   onRequestComplete(request) // send whether success, error, or aborted
 * 
 * Delegate can get info via:
 * 
 *   request.fullContent() 
 *   request.status()
 *   request.error()
 * 
 */

(class SvXhrRequest extends SvStorableNode {

  initPrototypeSlots () {
    /**
     * @member {Object} delegate - Optional reference to object that owns request
     */
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
      slot.setShouldStoreSlot(true);
    }

    /**
     * @member {String} url - The URL string for the request.
     */
    {
      const slot = this.newSlot("url", null);
      slot.setSlotType("String");
      slot.setShouldStoreSlot(true);
    }

    /**
     * @member {Object} requestOptions - dictionary containing method, headers, body
     */
    {
      const slot = this.newSlot("requestOptions", null);
      slot.setSlotType("Object");
      slot.setShouldStoreSlot(true);
    }

    /**
     * @member {XMLHttpRequest} xhr - The XMLHttpRequest object.
     */
    {
      const slot = this.newSlot("xhr", null);
      slot.setSlotType("XMLHttpRequest");
      slot.setShouldStoreSlot(false);
    }

    /**
     * @member {Promise} xhrPromise - The promise for the XMLHttpRequest.
     */
    {
      const slot = this.newSlot("xhrPromise", null); 
      slot.setSlotType("Promise");
    }

    /**
     * @member {String} requestId - The request ID. A UUID set on init.
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

    // max retries
    {
      const slot = this.newSlot("maxRetries", 3);
      slot.setInspectorPath(this.type());
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    // retry count
    {
      const slot = this.newSlot("retryCount", 0);
      slot.setInspectorPath(this.type());
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
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
     * @member {Action} copyResponseTextAction - The action to copy the response text.
     */
    {
      const slot = this.newSlot("copyResponseTextAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Copy Response Text");
      slot.setSyncsToView(false);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("copyResponseText");
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
    this.setRequestOptions({});
    this.setIsDebugging(true);
  }


  finalInit () {
    super.finalInit();
    this.setTitle("XHR Request");
  }

  // --- request options helpers ---

  /*
    example request options:

    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Bearer ${apiKey}`,
        'Accept-Encoding': 'identity'
      },
      body: this.body()
    }
  */

  /**
   * Sets the method for the request
   * @param {string} method 
   * @returns {SvXhrRequest}
   */
  setMethod (method) {
    assert(Type.isString(method));
    this.requestOptions().method = method;
    return this;
  }

  method () {
    return this.requestOptions().method;
  }

  /**
   * Sets the headers for the request
   * @param {Object} headers 
   * @returns {SvXhrRequest}
   */
  setHeaders (headers) {
    assert(Type.isDictionary(headers) && Type.isDeepJsonType(headers));
    this.requestOptions().headers = headers; // replace them entirelly
    return this;
  }

  headers () {
    return this.requestOptions().headers;
  }

  /**
   * Sets the body for the request
   * @param {string} body 
   * @returns {SvXhrRequest}
   */
  setBody (body) {
    assert(Type.isString(body) || Type.isFormData(body));
    this.requestOptions().body = body;
    return this;
  }

  body () {
    return this.requestOptions().body;
  }

  /**
   * Returns the number of bytes in the response
   * @returns {number}
   */
  contentByteCount () {
    const xhr = this.xhr();
    if (xhr && xhr.responseText) {
      return xhr.responseText.length;
    }
    return 0;
  }

  /**
   * Returns the subtitle for the request
   * @returns {string}
   */
  subtitle () {
    return [this.contentByteCount() + " bytes", this.status()].join("\n");
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
    throw new Error("showResponse not implemented");
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
    const parts = [
      `curl  --insecure "` + this.url() + '"',
    ];
    const headers = this.requestOptions().headers;

     Object.keys(headers).forEach((k) => {
      const v = headers[k];
      parts.push(` --header "${k}: ${v}"`);
    });

    const data = this.body();
    parts.push(` --data '` + data + `'`);
    return parts.join(" \\\n");
  }

  /**
   * Returns a description of the request
   * @returns {string}
   */
  description () {
    const optionsCopy = JSON.parse(JSON.stringify(this.requestOptions())); // breaks for non-JSON!

    const maxBodyLength = 1000;
    if (optionsCopy.body.length > maxBodyLength) {
      optionsCopy.body = optionsCopy.body.substring(0, maxBodyLength) + "...";
    }

    const json = {
      requestId: this.requestId(),
      url: this.url(),
      options: this.requestOptions(),
      readableState: this.readbleJsonState()
    };

    return JSON.stringify(json, null, 2);
  }

  /**
   * Sends the request and streams the response
   * @returns {Promise}
   */
  
  clear () {
    assert(!this.isActive(), "attempting to clear an active request");
    // clear such that we can reuse the request
    this.setError(null);
    this.setXhr(null);
    this.setXhrPromise(Promise.clone());
    this.setStatus("");
    this.setDidAbort(false);
    this.setRetryCount(0);
  }

  assertValid () {
    assert(this.url(), "url is required");

    const options = this.requestOptions();
    assert(options.method, "method is required");
    assert(options, "requestOptions is required");
    assert(options.headers, "headers is required");
    assert(Type.isDictionary(options.headers), "headers must be a dictionary");
    const body = options.body;
    assert(Type.isString(body) || Type.isFormData(body), "body must be a string");
  }

  async asyncSend () {
    this.setXhrPromise(Promise.clone());

    this.setError(null); // clear error (in case we are retrying)
    assert(!this.xhr());

    this.assertValid();

    //console.log("--- URL ---\n", this.activeApiUrl(), "\n-----------");
    //console.log("--- CURL ---\n", this.curlCommand(), "\n-----------");

    this.setStatus("sending request...");

    const xhr = new XMLHttpRequest();
    this.setXhr(xhr);
    xhr.open(this.method(), this.url());

    // set headers
    const options = this.requestOptions();
    
    // Special handling for FormData - never set Content-Type manually
    const isFormData = Type.isFormData(options.body);
    
    for (const header in options.headers) {
      const value = options.headers[header];
      
      // Skip Content-Type header for FormData - browser must set it with boundary
      if (isFormData && header.toLowerCase() === 'content-type') {
        console.warn("Skipping Content-Type header for FormData - browser will set it with boundary");
        continue;
      }
      
      xhr.setRequestHeader(header, value);
    }

    // let's print the url and headers here to the console
    console.log("--------------------------------");
    console.log("url:", this.url());
    console.log("method:", this.method());
    console.log("headers:", options.headers);
    if (isFormData) {
      console.log("body type: FormData (multipart/form-data)");
      console.log("Content-Type will be set automatically by browser with boundary");
    } else if (Type.isString(options.body)) {
      console.log("body type: String");
      console.log("body preview:", options.body.substring(0, 200) + (options.body.length > 200 ? "..." : ""));
    }
    console.log("--------------------------------");

    xhr.responseType = ""; // "" or "text" is required for streams
    
    const em = EventManager.shared();

    // NOTE: This is the reason why we use the false argument for the third argument to addEventListener:
    // https://stackoverflow.com/questions/51204603/read-response-stream-via-xmlhttprequest

    xhr.addEventListener("progress", (event) => {
      em.safeWrapEvent(() => {
        this.onXhrProgress(event);
      }, event)
    }, false);

    xhr.addEventListener("loadend", (event) => {
      try { 
        em.safeWrapEvent(() => { 
          this.onXhrLoadEnd(event);
        }, event);
      } catch (error) {
       this.onError(error); 
      }
    });

    xhr.addEventListener("error", (event) => {
      em.safeWrapEvent(() => { 
        this.onXhrError(event);
      }, event)
    });

    xhr.addEventListener("abort", (event) => {
      em.safeWrapEvent(() => { 
        this.onXhrAbort(event);
      }, event)
    });

    xhr.send(options.body);

    await this.xhrPromise(); // wait for the request to complete

    // only have a status error
    if (this.hasErrorStatusCode() || this.error()) {
      const m = JSON.stringify(this.readbleJsonState(), null, 2);
      this.setError(new Error(m));
      this.setStatus("Failed: " + m);
      this.sendDelegate("onRequestFailue", [this]);
    } else {
      this.setStatus("Succeeded");
      this.sendDelegate("onRequestSuccess", [this]);
    }

    this.sendDelegate("onRequestComplete", [this]);
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
    this.setStatus("progress: " + this.contentByteCount() + " bytes");
    this.sendDelegate("onRequestProgress", [this]);
  }

  errorFromStatusCode () {
    const xhr = this.xhr();
    if (!xhr) {
      return null;
    }
    return xhr.status;
  }

  hasError () {
    return this.error() !== null || this.hasErrorStatusCode();
  }

  hasErrorStatusCode () {
    const xhr = this.xhr();
    if (!xhr) {
      return false;
    }
    return xhr.status >= 300;
  }

  responseXmlError () {
    const text = this.responseText();
    try {
      if (text.startsWith("<?xml")) {
        if (text.includes("<Error>")) { // TODO: be more careful about response size...
          // parse XML and extract error message
          const xml = new DOMParser().parseFromString(text, "text/xml");
          const errorMessage = xml.querySelector("Error").textContent;
          if (errorMessage) {
            return errorMessage;
          }
          return false;
        }
      }
    } catch (error) {
      // ignore
    }
    return null;
  }

  responseJsonError () {
    const text = this.responseText();
    try {
      // see if there is a json error message
      if (text.length < 1024) { // so we don't try to parse a huge response
        const json = JSON.parse(text);
        const errorMessage = json.error;
        if (errorMessage) {
          return errorMessage;
        }
      }
    } catch (error) {
      // ignore
    }
    return null;
  }

  /**
   * @category XHR
   * @description Called when the XHR loadend event is fired
   * @param {Event} event 
   */
  onXhrLoadEnd (/*event*/) {
    //debugger;
    if (this.didAbort()) {
      return;
    }

    if (this.hasErrorStatusCode()) {
      const statusCode = this.xhr().status;
      const fullStatus = this.fullNameForXhrStatusCode(statusCode);

      console.log(this.description());

      // try to extract an error message from the response, if it has one

      const xhr = this.xhr();
      const contentType = xhr.getResponseHeader("Content-Type");
      if (contentType.includes("application/json")) {
        const errorMessageInJson = this.responseJsonError();
        if (errorMessageInJson) {
          const errorMessage = fullStatus + " json.error: " + errorMessageInJson;
          this.onXhrError(new Error(errorMessage));
        }
      } else if (contentType.includes("text/xml")) {
        const errorMessageInXml = this.responseXmlError();
        if (errorMessageInXml) {
          const errorMessage = fullStatus + " xml.error: " + errorMessageInXml;
          this.onXhrError(new Error(errorMessage));
        }
      } else {
        this.onXhrError(new Error(fullStatus));
      }
    }

    console.log(this.typeId() + " onXhrLoadEnd()");
    this.xhrPromise().callResolveFunc();

  }

  responseText () {
    return this.xhr().responseText;
  }

  /**
   * @category XHR
   * @description Retries the request
   */
  retryRequest () {
    this.setRetryCount(this.retryCount() + 1);
    this.setError(null);
    this.setXhr(null);
    this.setXhrPromise(null);
    this.setStatus("retrying");
    this.asyncSend();
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
   * @description Copies the response text to the clipboard
   * @returns {AiRequest}
   */
  copyResponseText () {
    this.responseText().copyToClipboard();
    return this;
  }

  /**
   * @description Called when the error slot is updated
   * @param {Error} oldValue 
   * @param {Error} newValue 
   */
  didUpdateSlotError (oldValue, newValue) {
    if (newValue) {
      this.setStatus("ERROR: " + newValue.message)
    }
  }

  // --- retry helpers ---

  retryIfApplicable () {
    if (this.shouldAutoRetryForCurrentError() && !this.hasExceededMaxRetries()) {
      this.retryWithDelay(this.currentRetryDelaySeconds());
      const ts = TimePeriodFormatter.clone().setValueInSeconds(nd).formattedValue();
      e.message = "retrying in " + ts;
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
    }, seconds * 1000);
  }
  
  hasExceededMaxRetries () {
    return this.retryCount() < this.maxRetries();
  }

  currentRetryDelaySeconds () {
    // calculate the current retry delay based on the retry count and the retry delay seconds
    const count = this.retryCount();  
    const d = this.retryDelaySeconds();
    const f = 2; // exponential backoff factor
    const nd = (d*f).randomBetween(d*f*count); // random spot between the next two exponential points
    return nd;
  }

  // -----------------------------------------------------------------------------

  /**
   * @category XHR
   * @description Called when the XHR error event is fired
   * @param {Error} e 
   */
  onXhrError (e) {
    const msg = e.message;
    this.setError(e);
    this.setStatus("ERROR: " + msg);
    console.warn(" ======================= " + this.type() + " ERROR: " + e.message + " ======================= ");
    //debugger;
    this.sendDelegate("onRequestError", [this, e]);

    if (e) {
      console.warn(this.debugTypeId() + " " + e.message);
    }
    return this;
  }


  /**
   * @category XHR
   * @description Called when the XHR abort event is fired
   * @param {Event} event 
   */
  onXhrAbort (/*event*/) {
    this.setDidAbort(true);
    this.setStatus("aborted");
    this.sendDelegate("onRequestAbort");
    this.xhrPromise().callRejectFunc(new Error("aborted"));
  }

  // -----------------------------------------------------------------------------

  readableStatus () {
    const xhr = this.xhr();
    if (!xhr) {
      return null;
    }
    return this.fullNameForXhrStatusCode(xhr.status);
  }

  readableReadyState () {
    const xhr = this.xhr();
    if (!xhr) {
      return null;
    }
    return this.nameForXhrReadyState(xhr.readyState);
  }

  readbleJsonState () {
    const xhr = this.xhr();

    if (!xhr) {
      return null;
    }

    const json = {
      readableReadyState: this.readableReadyState(),
      readableStatus: this.readableStatus(),
      statusText: xhr.statusText
    };

    if (this.error()) {
      json.error = this.error().message;
    }


    if (xhr.responseText) {
      const maxLength = 1000;
      if (xhr.responseText.length < maxLength) {
        json.responseText = xhr.responseText;
      } else {
        json.responseText = xhr.responseText.substring(0, maxLength) + "...";
      }
      json.responseByteCount = xhr.responseText.length;
    } else {
      json.note = "[no response text yet]";
    }

    return json;
  }

  /**
   * @category XHR
   * @description Returns a brief description of an XHR status code
   * @param {number} statusCode 
   * @returns {string}
   */
	nameForXhrStatusCode (statusCode) {
    const map = this.statusCodeMap();
    const entry = map.get(statusCode);
    return entry ? entry.name : "Unknown status";
  }

  shouldAutoRetryForXhrStatusCode (statusCode) {
    const map = this.statusCodeMap();
    const entry = map.get(statusCode);
    return entry ? entry.shouldAutoRetry : false;
  }

  /**
   * @category XHR
   * @description Returns a full description of an XHR status code
   * @param {number} statusCode 
   * @returns {string}
   */
  fullNameForXhrStatusCode (statusCode) {
    return statusCode + " (" + this.nameForXhrStatusCode(statusCode) + ")";
  }

  /**
   * @category Stopping
   * @description Returns true if the error is recoverable
   * @returns {boolean}
   */
  shouldAutoRetryForCurrentError () {
    //const e = this.error();
    // higher level code should probably hand the decision to retry based on the error message
    // but we'll just use the status code for now
    return this.shouldAutoRetryForXhrStatusCode(this.xhr().status);
  }
  

  /**
   * @category XHR
   * @description Returns a map of XHR status codes to their names
   * @returns {Map}
   */
  statusCodeMap () {
    const xhrStatuses = {
      0:   { name: "Request failed: Aborted, Network Error, or CORS Blocked", shouldAutoRetry: true },
      100: { name: "Continue", shouldAutoRetry: false },
      101: { name: "Switching Protocols", shouldAutoRetry: false },
      200: { name: "OK - Request successful", shouldAutoRetry: false },
      201: { name: "Created - Resource created", shouldAutoRetry: false },
      202: { name: "Accepted - Processing pending", shouldAutoRetry: false },
      204: { name: "No Content - Success, no body", shouldAutoRetry: false },
      301: { name: "Moved Permanently", shouldAutoRetry: false },
      302: { name: "Found - Temporary redirect", shouldAutoRetry: false },
      304: { name: "Not Modified", shouldAutoRetry: false },
      307: { name: "Temporary Redirect", shouldAutoRetry: false },
      308: { name: "Permanent Redirect", shouldAutoRetry: false },
      400: { name: "Bad Request", shouldAutoRetry: false },
      401: { name: "Unauthorized", shouldAutoRetry: false },
      402: { name: "Payment Required", shouldAutoRetry: false },
      403: { name: "Forbidden", shouldAutoRetry: false },
      404: { name: "Not Found", shouldAutoRetry: false },
      405: { name: "Method Not Allowed", shouldAutoRetry: false },
      408: { name: "Request Timeout", shouldAutoRetry: true },
      409: { name: "Conflict", shouldAutoRetry: false },
      429: { name: "Too Many Requests", shouldAutoRetry: true },
      500: { name: "Internal Server Error", shouldAutoRetry: true },
      502: { name: "Bad Gateway", shouldAutoRetry: true },
      503: { name: "Service Unavailable", shouldAutoRetry: true },
      504: { name: "Gateway Timeout", shouldAutoRetry: true }
    };
    
    return new Map(Object.entries(xhrStatuses));
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

  // -----------------------------------------------------------------------------


  /**
   * @category XHR
   * @description Returns true if the request is successful
   * @returns {boolean}
   */
  isSuccess () {
    const isStatusCodeSuccess = this.xhr().status >= 200 && this.xhr().status < 300;
    const isReadyStateSuccess = this.xhr().readyState === 4;
    return isStatusCodeSuccess && isReadyStateSuccess;
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
   * @description Sends a delegate message
   * @param {string} methodName 
   * @param {Array} args 
   * @returns {boolean}
   */
  sendDelegate (methodName, args = [this]) {
    const d = this.delegate();
    if (d) {
      const f = d[methodName];
      if (f) {
        //this.debugLog(this.typeId() + " sending " + d.typeId() + "." + methodName + "(" + (args[1]? args[1] : "") + ")");
        f.apply(d, args);
        return true;
      }
    }
    return false;
  }


}).initThisClass();
