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

    // fetching

    /**
     * @member {Object} fetchRequest - The fetch request object.
     * @category Networking
     */
    {
      const slot = this.newSlot("fetchRequest", null);
      slot.setSlotType("Object");
    }

    /**
     * @member {Boolean} isFetchActive - Indicates if a fetch is currently active.
     * @category State
     */
    {
      const slot = this.newSlot("isFetchActive", false);
      slot.setSlotType("Boolean");
    }

    /**
     * @member {Object} fetchAbortController - The AbortController for the fetch request.
     * @category Networking
     */
    {
      const slot = this.newSlot("fetchAbortController", null);
      slot.setSlotType("Object");
    }

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
     * @member {Promise} fetchPromise - The promise for the fetch operation.
     * @category Networking
     */
    {
      const slot = this.newSlot("fetchPromise", null);
      slot.setSlotType("Promise");
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
     * @member {WASound} sound - The WASound object for the received audio.
     * @category Audio
     */
    {
      const slot = this.newSlot("sound", null);
      slot.setSlotType("WASound");
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

    this.setFetchPromise(Promise.clone());
    this.setSound(WASound.clone());
    this.sound().setFetchPromise(this.fetchPromise());
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
    debugger;
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
   * @description Prepares the request options for the API call.
   * @returns {Object} The request options object.
   * @category Request Preparation
   */
  requestOptions () {
    const apiKey = this.service().apiKeyOrUserAuthToken();
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(this.bodyJson()),
    };
  }

  /**
   * @description Asserts that the request is valid before sending.
   * @throws {Error} If the API key or URL is missing.
   * @category Validation
   */
  assertValid () {
    assert(this.service().hasApiKey(), this.type() + " apiKey missing");
    assert(this.apiUrl(), this.type() + " apiUrl missing");
  }

  /**
   * @description Logs the request details for debugging.
   * @category Debugging
   */
  showRequest () {
    this.debugLog(
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
    this.debugLog(" response json: ", json);
    if (json.error) {
      console.warn(this.type() + " ERROR:", json.error.message);
    }
  }

  /**
   * @description Sends the request to the OpenAI API asynchronously.
   * @returns {Promise<void>}
   * @category Networking
   */
  async asyncSend () {
    try {
      this.setStatus("fetching");
      this.sendDelegate("onRequestBegin");

      this.assertValid();
      if (this.isDebugging()) {
        this.showRequest();
      }

      const options = this.requestOptions();
      const controller = new AbortController();
      this.setFetchAbortController(controller);
      options.signal = controller.signal;

      const response = await fetch(this.apiUrl(), options);
      this.setIsFetchActive(false);
      this.setFetchAbortController(null);

      const audioBlob = await response.blob();
      this.fetchPromise().callResolveFunc();
      this.setAudioBlob(audioBlob);

      this.sound().asyncLoadFromDataBlob(audioBlob);

      this.sendDelegate("onRequestComplete");

    } catch (error) {
      this.setIsFetchActive(false);
      console.error('Error:', error);
      this.onError(error);
    }
  }

  /**
   * @description Aborts the current fetch request if it's active.
   * @returns {OpenAiTtsRequest} The current instance.
   * @category Networking
   */
  abort () {
    if (this.isFetchActive()) {
      if (this.fetchAbortController()) {
        this.fetchAbortController().abort();
      }
      return this;
    } 

    return this;
  }

  /**
   * @description Shuts down the request by aborting any active fetch.
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
    this.sendDelegate("onRequestError", [this, error]);
    this.fetchPromise().callRejectFunc(error);
  }

  /**
   * @description Sends a delegate method call if the delegate exists and has the method.
   * @param {String} methodName - The name of the method to call on the delegate.
   * @param {Array} args - The arguments to pass to the delegate method.
   * @returns {Boolean} True if the delegate method was called, false otherwise.
   * @category Delegation
   */
  sendDelegate (methodName, args = [this]) {
    const d = this.delegate()
    if (d) {
      const f = d[methodName]
      if (f) {
        f.apply(d, args)
        return true
      }
    }
    return false
  }

}.initThisClass());