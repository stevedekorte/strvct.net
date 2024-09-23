"use strict";

/**
 * @module library.services.OpenAI.Text_to_Speech
 */

/**
 * @class OpenAiTtsRequest
 * @extends BMSummaryNode
 * @classdesc Represents a Text-to-Speech request to the OpenAI API.
 */
(class OpenAiTtsRequest extends BMSummaryNode {
 
  /**
   * @description Initializes the prototype slots for the OpenAiTtsRequest class.
   */
  initPrototypeSlots () {
    /**
     * @property {Object} delegate - Optional reference to service object that owns request.
     */
    {
      const slot = this.newSlot("delegate", null);
      slot.setSlotType("Object");
    }

    /**
     * @property {String} requestId - Unique identifier for the request.
     */
    {
      const slot = this.newSlot("requestId", null);
      slot.setSlotType("String");
    }

    /**
     * @property {String} apiUrl - The URL for the OpenAI API endpoint.
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
     * @property {Object} bodyJson - Contains the model choice and messages for the API request.
     */
    {
      const slot = this.newSlot("bodyJson", null);
      slot.setSlotType("JSON Object");
    }

    /**
     * @property {String} body - The stringified version of bodyJson.
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
     * @property {Object} fetchRequest - The fetch request object.
     */
    {
      const slot = this.newSlot("fetchRequest", null);
      slot.setSlotType("Object");
    }

    /**
     * @property {Boolean} isFetchActive - Indicates if a fetch is currently active.
     */
    {
      const slot = this.newSlot("isFetchActive", false);
      slot.setSlotType("Boolean");
    }

    /**
     * @property {Object} fetchAbortController - The AbortController for the fetch request.
     */
    {
      const slot = this.newSlot("fetchAbortController", null);
      slot.setSlotType("Object");
    }

    /**
     * @property {Error} error - Stores any error that occurs during the request.
     */
    {
      const slot = this.newSlot("error", null);
      slot.setSlotType("Error");
    }

    /**
     * @property {String} status - The current status of the request.
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
     * @property {Promise} fetchPromise - The promise for the fetch operation.
     */
    {
      const slot = this.newSlot("fetchPromise", null);
      slot.setSlotType("Promise");
    }

    /**
     * @property {Blob} audioBlob - The audio data received from the API.
     */
    {
      const slot = this.newSlot("audioBlob", null);
      slot.setSlotType("Blob");
    }

    /**
     * @property {WASound} sound - The WASound object for the received audio.
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
   */
  service () {
    return OpenAiService.shared();
  }

  /**
   * @description Returns the subtitle for the request, which is the current status.
   * @returns {String} The current status of the request.
   */
  subtitle () {
    return this.status();
  }

  /**
   * @description Sets the service object for the request.
   * @param {Object} anObject - The service object to set.
   * @returns {OpenAiTtsRequest} The current instance.
   */
  setService (anObject) {
    debugger;
    this.setDelegate(anObject);
    return this;
  }

  /**
   * @description Returns the stringified version of the bodyJson.
   * @returns {String} The stringified body of the request.
   */
  body () {
    return JSON.stringify(this.bodyJson(), 2, 2);
  }

  /**
   * @description Prepares the request options for the API call.
   * @returns {Object} The request options object.
   */
  requestOptions () {
    const apiKey = this.service().apiKey();
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
   */
  assertValid () {
    assert(this.service().hasApiKey(), this.type() + " apiKey missing");
    assert(this.apiUrl(), this.type() + " apiUrl missing");
  }

  /**
   * @description Logs the request details for debugging.
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
   */
  shutdown () {
    this.abort();
    return this;
  }

  /**
   * @description Handles errors that occur during the request.
   * @param {Error} error - The error that occurred.
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