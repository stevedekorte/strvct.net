"use strict";

/**
 * @module library.services.OpenAI.Text_to_Speech
 */

/**
 * @class OpenAiTtsRequest
 * @extends SvSummaryNode
 * @classdesc Represents a Text-to-Speech request to the OpenAI API.
 */
(class OpenAiTtsRequest extends SvSummaryNode {
 
  /**
   * @description Initializes the prototype slots for the OpenAiTtsRequest class.
   */
  initPrototypeSlots () {
    /**
     * @member {Object} delegate - Optional reference to service object that owns request.
     * @category Configuration
     */
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
    }

    /**
     * @member {String} requestId - Unique identifier for the request.
     * @category Identification
     */
    {
      const slot = this.newSlot("requestId", null);
      slot.setSlotType("String");
    }

    /**
     * @member {String} apiUrl - The URL for the OpenAI API endpoint.
     * @category Configuration
     */
    {
      const slot = this.newSlot("apiUrl", null);
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }

    /**
     * @member {Object} bodyJson - Contains the model choice and messages for the API request.
     * @category Request Data
     */
    {
      const slot = this.newSlot("bodyJson", null);
      slot.setSlotType("JSON Object");
    }

    /**
     * @member {String} body - The stringified version of bodyJson.
     * @category Request Data
     */
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

    // request state


    /**
     * @member {Error} error - Stores any error that occurs during the request.
     * @category Error Handling
     */
    {
      const slot = this.newSlot("error", null);
      slot.setSlotType("Error");
    }

    /**
     * @member {String} status - The current status of the request.
     * @category State
     */
    {
      const slot = this.newSlot("status", "");
      slot.setInspectorPath("");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
    }


    /**
     * @member {Blob} audioBlob - The audio data received from the API.
     * @category Response Data
     */
    {
      const slot = this.newSlot("audioBlob", null);
      slot.setSlotType("Blob");
    }

    /**
     * @member {SvWaSound} sound - The SvWaSound object for the received audio.
     * @category Audio
     */
    {
      const slot = this.newSlot("sound", null);
      slot.setSlotType("SvWaSound");
    }

    /**
     * @member {SvXhrRequest} svXhrRequest - The XHR request instance when using proxy.
     * @category Networking
     */
    {
      const slot = this.newSlot("svXhrRequest", null);
      slot.setSlotType("SvXhrRequest");
    }

    this.setShouldStore(false);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * @description Initializes the OpenAiTtsRequest instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setIsDebugging(false);
    this.setRequestId(this.puuid());
    this.setTitle("Request");

    const sound = SvWaSound.clone();
    this.setSound(sound);
    
    // Create and set the fetchPromise immediately
    // This ensures the sound has a promise to wait on before it's queued
    const fetchPromise = Promise.clone();
    sound.setFetchPromise(fetchPromise);
    
    // Store the promise so we can resolve/reject it later
    this._fetchPromise = fetchPromise;
  }

  /**
   * @description Returns the OpenAI service instance.
   * @returns {OpenAiService} The shared OpenAI service instance.
   * @category Service
   */
  service () {
    return OpenAiService.shared();
  }

  /**
   * @description Returns the subtitle for the request, which is the current status.
   * @returns {String} The current status of the request.
   * @category UI
   */
  subtitle () {
    return this.status();
  }

  /**
   * @description Sets the service object for the request.
   * @param {Object} anObject - The service object to set.
   * @returns {OpenAiTtsRequest} The current instance.
   * @category Configuration
   */
  setService (anObject) {
    this.setDelegate(anObject);
    return this;
  }

  /**
   * @description Returns the stringified version of the bodyJson.
   * @returns {String} The stringified body of the request.
   * @category Request Data
   */
  body () {
    return JSON.stringify(this.bodyJson(), null, 2);
  }

  /**
   * @description Returns the proxied URL if a proxy server is configured.
   * @returns {string} The proxied URL or the original URL if no proxy is available.
   * @category Request Preparation
   */
  proxyUrl () {
    const ProxyServers = SvGlobals.get("ProxyServers");
    if (ProxyServers && ProxyServers.shared().defaultServer()) {
      return ProxyServers.shared().defaultServer().proxyUrlForUrl(this.apiUrl());
    }
    return this.apiUrl();
  }

  /**
   * @description Creates a proxy XHR request for the given URL.
   * @returns {Promise<SvXhrRequest>} An XHR request configured for proxy.
   * @category Request Preparation
   */
  async proxyXhrForUrl () {
    const SvXhrRequest = SvGlobals.globals().SvXhrRequest;
    const xhr = SvXhrRequest.clone();
    xhr.setUrl(this.proxyUrl());
    xhr.setMethod("POST");
    xhr.setHeaders({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${await this.service().apiKeyOrUserAuthToken()}`
    });
    xhr.setDelegate(this);
    xhr.setBody(JSON.stringify(this.bodyJson()));
    xhr.setResponseType("blob"); // Set to blob for binary audio data
    return xhr;
  }


  /**
   * @description Asserts that the request is valid before sending.
   * @throws {Error} If the API key or URL is missing.
   * @category Validation
   */
  assertValid () {
    assert(this.service().hasApiKey(), this.svType() + " apiKey missing");
    assert(this.apiUrl(), this.svType() + " apiUrl missing");
  }

  /**
   * @description Logs the request details for debugging.
   * @category Debugging
   */
  showRequest () {
    this.logDebug(
      " request " +
      this.requestId() +
      " apiUrl: " +
        this.apiUrl() +
        " body: " + 
        JSON.stringify(this.bodyJson()) +
        "'"
    );
  }

  /**
   * @description Logs the response details for debugging.
   * @category Debugging
   */
  showResponse () {
    const json = this.json();
    this.logDebug(" response json: ", json);
    if (json.error) {
      console.warn(this.svType() + " ERROR:", json.error.message);
    }
  }

  /**
   * @description Sends the request to the OpenAI API asynchronously.
   * @returns {Promise<void>}
   * @category Networking
   */
  async asyncSend () {
    // Use the fetchPromise that was already set on the sound in init()
    const fetchPromise = this._fetchPromise;
    
    try {
      this.setStatus("sending");
      this.sendDelegateMessage("onRequestBegin");

      this.assertValid(); 
      if (this.isDebugging()) {
        this.showRequest();
      }

      // Create XHR request with proxy support
      const xhrRequest = await this.proxyXhrForUrl();
      this.setSvXhrRequest(xhrRequest);
      
      // Send the request
      await xhrRequest.asyncSend();
      
      // Check if successful
      if (!xhrRequest.isSuccess()) {
        const statusCode = xhrRequest.statusCode();
        const statusText = xhrRequest.statusText();
        throw new Error(`TTS API error: ${statusCode} - ${statusText}`);
      }

      // Log the full request details for debugging
      console.log("OpenAiTtsRequest: Request completed\n" + xhrRequest.description());
      
      // Get the audio blob from the response
      const xhr = xhrRequest.xhr();
      const audioBlob = xhr.response;
      
      if (!audioBlob) {
        throw new Error("No response blob received from TTS API");
      }
      
      console.log(`TTS Response: size=${audioBlob.size}, type=${audioBlob.type}`);
      
      // Check if blob is suspiciously small (less than 1KB is likely an error)
      if (audioBlob.size < 1000) {
        const text = await audioBlob.text();
        console.warn("TTS response too small, content:", text);
        
        // Try to parse as JSON error
        try {
          const errorJson = JSON.parse(text);
          if (errorJson.error) {
            throw new Error(`TTS API error: ${errorJson.error.message || errorJson.error}`);
          }
        } catch (e) {
            if (e) {
                // just here to keep the linter happy
            }
          // Not JSON, continue
        }
        
        throw new Error(`TTS response too small (${audioBlob.size} bytes) - may be an error response`);
      }
      
      // Check if we got an HTML error page instead of audio
      if (audioBlob.type && audioBlob.type.includes('text/html')) {
        const text = await audioBlob.text();
        console.error("Received HTML instead of audio:", text.substring(0, 500));
        throw new Error("Received HTML error page instead of audio data");
      }
      
      this.setAudioBlob(audioBlob);
      
      try {
        const sound = this.sound();
        console.log("OpenAiTtsRequest: Loading audio blob into SvWaSound...");
        await sound.asyncLoadFromDataBlob(audioBlob);
        console.log("OpenAiTtsRequest: Audio loaded", JSON.stringify({
          data: sound.data(),
          hasData: sound.hasData(),
          dataByteLength: sound.data() ? sound.data().byteLength : null,
          loadState: sound.loadState()
        }, null, 2));
      } catch (error) {
        console.error("Failed to load audio data into SvWaSound:", error);
        throw new Error(`Failed to decode audio: ${error.message}`);
      }

      this.sendDelegateMessage("onRequestComplete");
      
      // Resolve the fetchPromise now that everything is complete
      fetchPromise.callResolveFunc();
      
      // Clean up
      this.setSvXhrRequest(null);

    } catch (error) {
      console.error('Error:', error);
      this.onError(error);
      this.setSvXhrRequest(null);
      
      // Reject the fetchPromise on error
      fetchPromise.callRejectFunc(error);
    }
  }

  /**
   * @description Aborts the current request if it's active.
   * @returns {OpenAiTtsRequest} The current instance.
   * @category Networking
   */
  abort () {
    if (this.svXhrRequest()) {
      this.svXhrRequest().abort();
      this.setSvXhrRequest(null);
    }
    return this;
  }

  /**
   * @description Shuts down the request by aborting any active request.
   * @returns {OpenAiTtsRequest} The current instance.
   * @category Lifecycle
   */
  shutdown () {
    this.abort();
    return this;
  }

  /**
   * @description Handles errors that occur during the request.
   * @param {Error} error - The error that occurred.
   * @category Error Handling
   */
  onError (error) {
    this.sendDelegateMessage("onRequestError", [this, error]);
    this.setError(error);
  }

}.initThisClass());