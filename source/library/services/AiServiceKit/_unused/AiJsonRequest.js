/**
 * @module library.services.AiServiceKit
 */

/**
 * @class AiJsonRequest
 * @extends AiRequest
 * @classdesc An AiRequest that uses a JsonStreamReader to parse the response
 * and calls onJsonStreamReaderPopContainer(reader, json) with each container parsed
 */
"use strict";

(class AiJsonRequest extends AiRequest { 

  initPrototypeSlots () {
    /**
     * @member {JsonStreamReader|null} jsonStreamReader
     * @category Data
     */
    {
      const slot = this.newSlot("jsonStreamReader", null);
      slot.setSlotType("JsonStreamReader");
    }

    /**
     * @member {number} containerChunkLevel - depth of json to call onStreamJsonChunk(json)
     * @category Configuration
     */
    {
      const slot = this.newSlot("containerChunkLevel", 2);
      slot.setSlotType("Number");
    }
  }

  /**
   * @description Initializes the AiJsonRequest
   * @category Initialization
   */
  init () {
    super.init();
    this.setIsDebugging(true);

    const reader = JsonStreamReader.clone();
    reader.setDelegate(this);
    this.setJsonStreamReader(reader);
  }

  /**
   * @description Sets up the request for streaming
   * @returns {AiJsonRequest} The current instance
   * @category Setup
   */
  setupForStreaming () {
    return this;
  }

  /**
   * @description Asynchronously sends the request and streams the response
   * @returns {Promise}
   * @category Network
   */
  async asyncSendAndStreamResponse () {
    if (!this.isContinuation()) {
      this.jsonStreamReader().beginJsonStream();
    }
    return super.asyncSendAndStreamResponse();
  }

  /**
   * @description Reads XHR lines and processes them
   * @private
   * @category Data Processing
   */
  readXhrLines () {
    try {
      const newText = this.readRemaining();
      if (newText) {
        this.jsonStreamReader().onStreamJson(newText);
      }
    } catch (error) {
      this.onError(error);
      this.xhrPromise().callRejectFunc(new Error(error));      
    }
  }

  /**
   * @description Handles JSON stream reader errors
   * @param {JsonStreamReader} reader - The JSON stream reader
   * @param {Error} error - The error that occurred
   * @category Error Handling
   */
  onJsonStreamReaderError (reader, error) {
    this.setError(error);
    this.abort();
  }

  /**
   * @description Handles popped containers from the JSON stream reader
   * @param {JsonStreamReader} reader - The JSON stream reader
   * @param {Object} json - The JSON object popped from the container
   * @throws {Error} Throws an error if not overridden by subclass
   * @category Data Processing
   */
  onJsonStreamReaderPopContainer (reader, json) {
    throw new Error(this.type() + " onJsonStreamReaderPopContainer(reader, json) should be overridden by subclass");
  }

}).initThisClass();