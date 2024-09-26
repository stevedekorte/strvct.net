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
     */
    {
      const slot = this.newSlot("jsonStreamReader", null);
    }

    /**
     * @member {number} containerChunkLevel - depth of json to call onStreamJsonChunk(json)
     */
    {
      const slot = this.newSlot("containerChunkLevel", 2);
    }
  }

  /**
   * @description Initializes the AiJsonRequest
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
   */
  setupForStreaming () {
    return this;
  }

  /**
   * @description Asynchronously sends the request and streams the response
   * @returns {Promise}
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
   */
  onJsonStreamReaderPopContainer (reader, json) {
    throw new Error(this.type() + " onJsonStreamReaderPopContainer(reader, json) should be overridden by subclass");
  }

}).initThisClass();