/**
 * @module library.services.AiServiceKit
 */

"use strict";

/**
 * @class SvXhrRequest
 * @extends SvStorableNode
 * @classdesc Wrapper for request to API service that manages streaming the response and checking for various errors.
 * 
 * Caller can set:
 *   - delegate
 *   - url (required)
 *   - headers
 *   - body
 *   - json
 *   - isStreaming (default false)
 *   - requestId (default puuid)
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

    // max retries
    {
      const slot = this.newSlot("maxRetries", 3);
      slot.setInspectorPath(this.svType());
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
      slot.setInspectorPath(this.svType());
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("timeoutPeriodInMs", 60000); // 30 seconds
      slot.setInspectorPath(this.svType());
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
     * @member {Boolean} didTimeout - Whether the request timed out.
     */
    {
      const slot = this.newSlot("didTimeout", false);
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

    /**
     * @member {String} responseType - The XMLHttpRequest responseType ('', 'arraybuffer', 'blob', 'document', 'json', 'text')
     */
    {
      const slot = this.newSlot("responseType", "");
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(false);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(true);
      slot.setDescription("The XMLHttpRequest responseType. Use 'blob' for binary data like images or audio.");
    }

    /**
     * @member {Promise} completionPromise - Promise that resolves when the XHR request completes (success, error, or abort)
     */
    {
      const slot = this.newSlot("completionPromise", null);
      slot.setSlotType("Promise");
      slot.setShouldStoreSlot(false);
      slot.setDescription("Promise that resolves when the XHR request completes, regardless of outcome");
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
    this.setCompletionPromise(Promise.clone());
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
   * @param {string|FormData|Blob|ArrayBuffer} body 
   * @returns {SvXhrRequest}
   */
  setBody (body) {
    assert(Type.isString(body) || Type.isFormData(body) || Type.isBlob(body) || Type.isArrayBuffer(body));
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
    if (!xhr) {
      return 0;
    }
    
    // Handle different response types
    if (this.responseType() === 'blob' && xhr.response) {
      return xhr.response.size || 0;
    } else if (this.responseType() === 'arraybuffer' && xhr.response) {
      return xhr.response.byteLength || 0;
    } else if ((this.responseType() === '' || this.responseType() === 'text') && xhr.responseText) {
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
    if (this.isDebugging()) console.log(this.logPrefix(), this.description());
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
    const size = this.contentByteCount();
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
    if (optionsCopy.body && typeof optionsCopy.body === 'string' && optionsCopy.body.length > maxBodyLength) {
      optionsCopy.body = optionsCopy.body.substring(0, maxBodyLength) + "...";
    }

    // let's also clip the authorization header to just the first 10 characters
    if (optionsCopy.headers && optionsCopy.headers.Authorization) {
      optionsCopy.headers.Authorization = optionsCopy.headers.Authorization.substring(0, 10) + "...";
    }

    const json = {
      requestId: this.requestId(),
      url: this.url(),
      options: optionsCopy,
      readableState: this.readableJsonState()
    };

    return JSON.stringify(json, null, 2);
  }

  clear () {
    assert(!this.isActive(), "attempting to clear an active request");
    // clear such that we can reuse the request
    this.setError(null);
    this.setXhr(null);
    this.setXhrPromise(Promise.clone());
    this.setCompletionPromise(Promise.clone());
    this.setStatus("");
    this.setDidAbort(false);
    this.setDidTimeout(false);
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
    // Body is optional for GET/HEAD requests
    if (body !== undefined && body !== null) {
      assert(Type.isString(body) || Type.isFormData(body) || Type.isBlob(body) || Type.isArrayBuffer(body), "body must be a string, FormData, Blob, or ArrayBuffer");
    }
  }

  /**
   * Sends the request and streams the response
   * @returns {Promise}
   */
  

  async asyncSend () {
    this.setXhrPromise(Promise.clone());
    this.setCompletionPromise(Promise.clone());

    this.setError(null); // clear error (in case we are retrying)
    assert(!this.xhr());

    this.assertValid();

    //console.log(this.logPrefix(), "--- URL ---\n", this.activeApiUrl(), "\n-----------");
    //console.log(this.logPrefix(), "--- CURL ---\n", this.curlCommand(), "\n-----------");

    this.setStatus("sending request...");

    const xhr = new XMLHttpRequest();
    this.setXhr(xhr);
    xhr.timeout = this.timeoutPeriodInMs();
    xhr.open(this.method(), this.url());

    // set headers
    const options = this.requestOptions();
    
    // Special handling for FormData - never set Content-Type manually
    const isFormData = Type.isFormData(options.body);
    
    for (const header in options.headers) {
      const value = options.headers[header];
      
      // Skip Content-Type header for FormData - browser must set it with boundary
      if (isFormData && header.toLowerCase() === 'content-type') {
        console.warn("**WARNING**:", this.logPrefix(), "Skipping Content-Type header for FormData - browser will set it with boundary");
        continue;
      }
      
      xhr.setRequestHeader(header, value);
    }

    if (this.isDebugging()) {
        // let's print the url and headers here to the console
        let bodyInfo = "";
        if (isFormData) {
            bodyInfo = "FormData (multipart/form-data, Content-Type set automatically by browser with boundary)";
        } else if (Type.isString(options.body)) {
            const preview = options.body.substring(0, 200) + (options.body.length > 200 ? "..." : "");
            bodyInfo = `String: ${preview}`;
        } else if (Type.isBlob(options.body)) {
            bodyInfo = `Blob, size: ${options.body.size} bytes, type: ${options.body.type || "unknown"}`;
        } else if (Type.isArrayBuffer(options.body)) {
            bodyInfo = `ArrayBuffer, size: ${options.body.byteLength} bytes`;
        }
        if (this.isDebugging()) {
            const dict = {
                url: this.url(),
                method: this.method(),
                bodyType: bodyInfo,
                headers: options.headers
            };
            console.log(this.logPrefix(), JSON.stringify(dict, null, 2));
        }
    }

    xhr.responseType = this.responseType(); // "" or "text" is required for streams, "blob" for binary data
    
    const em = EventManager.shared();

    // NOTE: This is the reason why we use the false argument for the third argument to addEventListener:
    // https://stackoverflow.com/questions/51204603/read-response-stream-via-xmlhttprequest

    xhr.addEventListener("loadstart", (event) => {
      em.safeWrapEvent(() => {
        this.onXhrLoadStart(event);
      }, event)
    });

    xhr.addEventListener("progress", (event) => {
      em.safeWrapEvent(() => {
        this.onXhrProgress(event);
      }, event)
    }, false);

    xhr.addEventListener("load", (event) => {
      em.safeWrapEvent(() => {
        this.onXhrLoad(event);
      }, event)
    });

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
        // Get error details from XHR (event.error is usually null for XHR errors)
        const status = this.readableStatus(); // event.target.status; 
        const readyState = this.readableReadyState(); // event.target.statusText;
        const responseText = this.responseText(); // event.target.responseText;
        
        // Create an Error object with detailed message like the parent class does
        const errorMessage = `XHR error: status: ${status} (${readyState}), response: ${responseText || 'none'}`;
        const error = new Error(errorMessage);
        
        this.onXhrError(error);
      }, event)
    });

    xhr.addEventListener("abort", (event) => {
      em.safeWrapEvent(() => { 
        this.onXhrAbort(event);
      }, event)
    });

    xhr.addEventListener("timeout", (event) => {
      em.safeWrapEvent(() => {
        const error = new Error(`Request timeout: exceeded ${this.timeoutPeriodInMs()}ms`);
        this.onXhrTimeout(error);
      }, event)
    });

    // For GET and HEAD requests, don't send a body (even if it's undefined/null)
    // This prevents Firebase from returning 400 errors
    const methodsWithoutBody = ['GET', 'HEAD', 'DELETE'];
    if (methodsWithoutBody.includes(options.method.toUpperCase())) {
      xhr.send();
    } else {
      xhr.send(options.body);
    }

    await this.xhrPromise(); // wait for the request to complete

    // only have a status error
    if (this.hasErrorStatusCode() || this.error()) {
      // If we don't already have an error set by onXhrError, create one
      if (!this.error()) {
        const m = JSON.stringify(this.readableJsonState(), null, 2);
        this.setError(new Error(m));
      }
      this.setStatus("Failed: " + this.causeOfError());
      //debugger;
      this.sendDelegate("onRequestFailure", [this]);
    } else {
      this.setStatus("Succeeded");
      this.sendDelegate("onRequestSuccess", [this]);
    }

    this.sendDelegate("onRequestComplete", [this]);
    
    // Resolve the completion promise to signal the request is done
    this.completionPromise().callResolveFunc();
  }

  /**
   * @category XHR
   * @description Called when the XHR loadstart event is fired
   * @param {ProgressEvent} event 
   */
  onXhrLoadStart (/*event*/) {
    this.setStatus("request started");
    this.sendDelegate("onRequestBegin", [this]);
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
    console.log(this.logPrefix(), ".onXhrProgress() read [" + latestString + "]");
    */
    this.setStatus("progress: " + this.contentByteCount() + " bytes");
    this.sendDelegate("onRequestProgress", [this]);
  }

  // --- status and error handling ---

  statusCode () {
    const xhr = this.xhr();
    return xhr ? xhr.status : null;
  }

  statusText () {
    const xhr = this.xhr();
    return xhr ? xhr.statusText : null;
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
      console.error("**ERROR**:", this.logPrefix(), "responseXmlError() error: " + error.message);
    }
    return null;
  }

  responseJsonError () {
    const text = this.responseText();
    try {
      // see if there is a json error message
      if (text.length < 1024) { // so we don't try to parse a huge response
        const json = JSON.parse(text);
        
        // Check for various common error structures
        // 1. Direct error string: { error: "message" }
        if (typeof json.error === 'string' && json.error) {
          return json.error;
        }
        
        // 2. Nested error object: { error: { message: "message" } }
        if (json.error && typeof json.error === 'object' && json.error.message) {
          return json.error.message;
        }
        
        // 3. Direct message field: { message: "error message" }
        if (typeof json.message === 'string' && json.message) {
          return json.message;
        }
        
        // 4. Error array: { errors: [{message: "message"}] }
        if (Array.isArray(json.errors) && json.errors.length > 0) {
          const firstError = json.errors[0];
          if (typeof firstError === 'string') {
            return firstError;
          }
          if (firstError.message) {
            return firstError.message;
          }
        }
        
        // 5. If error is an object but no message field, stringify it
        if (json.error && typeof json.error === 'object') {
          return JSON.stringify(json.error);
        }
      }
    } catch (error) {
      console.error("**ERROR**:", this.logPrefix(), "responseJsonError() error: " + error.message);
      // ignore
    }
    return null;
  }

  /**
   * @category XHR
   * @description Called when the XHR load event is fired (successful completion only)
   * @param {Event} event 
   */
  onXhrLoad (/*event*/) {
    // This fires only on successful completion (status 200-299)
    // We can use this for success-specific logic if needed
    // Currently most logic is in loadend which fires for all completions
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
      if (!SvPlatform.isOnline()) {
        this.onXhrError(new Error("Internet connection down."));
      } else {
        const statusCode = this.xhr().status;
        const fullStatus = this.fullNameForXhrStatusCode(statusCode);

        if (this.isDebugging()) console.log(this.logPrefix(), this.description());

        // try to extract an error message from the response, if it has one

        const xhr = this.xhr();
        const contentType = xhr.getResponseHeader("Content-Type");
        if (contentType && contentType.includes("application/json")) {
            const errorMessageInJson = this.responseJsonError();
            if (errorMessageInJson) {
            const errorMessage = errorMessageInJson + ". (json.error) " + fullStatus;
            this.onXhrError(new Error(errorMessage));
            }
        } else if (contentType && contentType.includes("text/xml")) {
            const errorMessageInXml = this.responseXmlError();
            if (errorMessageInXml) {
            const errorMessage = errorMessageInXml + ". (xml.error) " + fullStatus;
            this.onXhrError(new Error(errorMessage));
            }
        } else {
            this.onXhrError(new Error(fullStatus));
        }
      }
    }

    this.xhrPromise().callResolveFunc();
  }

  responseText () {
    const xhr = this.xhr();
    if (!xhr) {
      return null;
    }
    
    // Only access responseText for text-based responses
    if (this.responseType() === '' || this.responseType() === 'text') {
      return xhr.responseText;
    }
    
    // For other response types, return a description
    if (this.responseType() === 'blob') {
      return "[Binary blob data]";
    } else if (this.responseType() === 'arraybuffer') {
      return "[Binary array buffer]";
    }
    
    return null;
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
    this.setCompletionPromise(null);
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
    console.log(this.logPrefix(), ".retryWithDelay(" + seconds + " seconds)");
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
    console.warn("=== ERROR while sending", this.logPrefix(), " === \n" + this.description() + "\n=====================================================\n");
    debugger;
    //debugger;
    //const didHandle = 
    this.sendDelegate("onRequestError", [this, e]);

    if (e) {
      console.warn("**WARNING**:", this.logPrefix(), this.svDebugId() + " " + e.message);
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
    
    // Also resolve the completion promise when aborted
    this.completionPromise().callResolveFunc();
  }

  /**
   * @category XHR
   * @description Called when the XHR timeout event is fired
   * @param {Error} error - The timeout error
   */
  onXhrTimeout (error) {
    assert(error instanceof Error, "onXhrTimeout error not instance of Error");

    debugger;
    if (!SvPlatform.isOnline()) {
        error.message = "Internet connection down. " + error.message;
    }

    this.setDidTimeout(true);
    this.setError(error);

    console.log(this.logPrefix(), "----------------------------------------");
    this.setStatus("ERROR: " + error.message);
    console.error("**ERROR**:", this.logPrefix(), ".onXhrTimeout" + error.message);
    this.sendDelegate("onRequestTimeout", [this, error]);
    
    if (error) {
      console.warn("**WARNING**:", this.logPrefix(), this.svDebugId() + " " + error.message);
    }
    
    if (!this.sendDelegate("onRequestError", [this, error])) {
        // no onRequestError delegate, so throw a descriptive error
        this.throwDescriptiveError(this.causeOfError() + ". ");
    }
  }

  throwDescriptiveError (prefix = "") {
    const error = new Error(this.descriptiveErrorMessage(prefix));
    throw error;
  }

  descriptiveErrorMessage (prefix = "") {
    const json = {
      status: this.readableStatus(),
      readyState: this.readableReadyState(),
      error: this.error()?.message,
      responseText: this.responseText(),
      shouldAutoRetry: this.shouldAutoRetryForCurrentError()
    };
    
    if (this.didTimeout()) {
        json.didTimeout = true;
        json.timeoutPeriod = this.timeoutPeriodInMs()/1000 + " seconds";
    }
    return prefix + JSON.stringify(json, null, 2);
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

  readableJsonState () {
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


    // Handle response based on responseType
    if (this.responseType() === '' || this.responseType() === 'text') {
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
    } else if (this.responseType() === 'blob' && xhr.response) {
      json.responseType = "blob";
      json.responseByteCount = xhr.response.size || 0;
      json.note = `[Binary blob: ${xhr.response.type || 'unknown type'}]`;
    } else if (this.responseType() === 'arraybuffer' && xhr.response) {
      json.responseType = "arraybuffer";
      json.responseByteCount = xhr.response.byteLength || 0;
      json.note = "[Binary array buffer]";
    } else {
      json.note = "[no response data yet]";
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
    // Check if this was a timeout - timeouts are often transient and worth retrying
    if (this.didTimeout()) {
      return true;
    }
    
    // Check if this was an abort - aborts should not be retried
    if (this.didAbort()) {
      return false;
    }
    
    // For other errors, check the status code
    const xhr = this.xhr();
    if (xhr) {
      return this.shouldAutoRetryForXhrStatusCode(xhr.status);
    }
    
    return false;
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
        //if (this.isDebugging()) console.log(this.logPrefix(), this.svTypeId() + " sending " + d.svTypeId() + "." + methodName + "(" + (args[1]? args[1] : "") + ")");
        f.apply(d, args);
        return true;
      }
    }
    return false;
  }

  // --- error handling ---

  /**
   * @category XHR
   * @description Returns a string describing the cause of the error
   * @returns {string}
   */

  causeOfError () {
    const xhr = this.xhr();
    if (!xhr) {
        return "No XHR object available";
    }
    
    const status = xhr.status;
    const readyState = xhr.readyState;
    const error = this.error();
    const responseText = this.responseText();
    
    const causes = [];

    if (!SvPlatform.isOnline()) { // NOTE: we assume this method is called at time of error
       causes.push("Internet connection down.");
    }
    
    // Check for timeout first (most specific)
    if (this.didTimeout()) {
        causes.push(`Request timeout (exceeded ${this.timeoutPeriodInMs()/1000} seconds)`);
    }
    
    // Network and connection issues
    else if (status === 0) {
        if (this.didAbort()) {
            causes.push("request was aborted");
        } else if (readyState === 0) {
            causes.push("request not initialized");
        } else {
            // Status 0 with non-zero readyState indicates network failure
            causes.push("network error (possible causes: CORS blocked, connection refused, SSL/TLS error, offline)");
        }
    }
    
    // HTTP error statuses
    else if (status >= 300 && status < 400) {
        causes.push(`redirect error (${this.fullNameForXhrStatusCode(status)})`);
    } else if (status >= 400 && status < 500) {
        causes.push(`client error (${this.fullNameForXhrStatusCode(status)})`);
    } else if (status >= 500) {
        causes.push(`server error (${this.fullNameForXhrStatusCode(status)})`);
    }
    
    // Connection state issues
    if (readyState > 0 && readyState < 4 && status !== 0 && !this.didTimeout()) {
        causes.push("incomplete request (connection may have dropped)");
    }
    
    // Include error message if available (but avoid duplicating timeout message)
    if (error && !this.didTimeout()) {
        const errorMsg = error.message || error.toString();
        if (errorMsg && !causes.some(c => c.includes(errorMsg))) {
            causes.push(`error: "${errorMsg}"`);
        }
    }
    
    // Check for empty response on success status
    if (status >= 200 && status < 300 && !responseText) {
        causes.push("successful status but empty response");
    }
    
    // Provide specific guidance for common issues
    if (status === 0 && window.location.protocol === 'file:' && !this.didTimeout() && !this.didAbort()) {
        causes.push("file:// protocol detected - XMLHttpRequest may be blocked");
    }
    
    return causes.length > 0 ? causes.join("; ") : "unknown error";
  }


}).initThisClass();
