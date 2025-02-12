"use strict";

/**
 * @module library.services.Gemini
 */

/**
 * @class GeminiRequest
 * @extends AiRequest
 * @classdesc Handles requests to the Gemini API.
 *
 * Example CURL request:
 *
 * curl -X POST \
 *     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
 *     -H "Content-Type: application/json; charset=utf-8" \
 *     -d @request.json \
 *     "https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/us-central1/publishers/google/models/gemini-1.0-pro:streamGenerateContent?alt=sse"
 *
 * Example request body JSON:
 *
 *   {
 *     "contents": {
 *       "role": "ROLE",
 *       "parts": { "text": "TEXT" }
 *     },
 *     "system_instruction":
 *     {
 *       "parts": [
 *         {
 *           "text": "SYSTEM_INSTRUCTION"
 *         }
 *       ]
 *     },
 *     "safety_settings": {
 *       "category": "SAFETY_CATEGORY",
 *       "threshold": "THRESHOLD"
 *     },
 *     "generation_config": {
 *       "temperature": TEMPERATURE,
 *       "topP": TOP_P,
 *       "topK": TOP_K,
 *       "candidateCount": 1,
 *       "maxOutputTokens": MAX_OUTPUT_TOKENS,
 *       "stopSequences": STOP_SEQUENCES,
 *     }
 *   }
 */
(class GeminiRequest extends AiRequest { 

  initPrototypeSlots () {
    /**
     * @member {JsonStreamReader} jsonStreamReader - The JSON stream reader for handling streamed responses.
     * @category Data Processing
     */
    {
      const slot = this.newSlot("jsonStreamReader", null);
      slot.setSlotType("JsonStreamReader");

    }
    
    /**
     * @member {number} usageOutputTokenCount - The count of output tokens used in the request.
     * @category Usage Metrics
     */
    {
      const slot = this.newSlot("usageOutputTokenCount", null);
      slot.setSlotType("Number");
    }
  }

  /**
   * @description Initializes the GeminiRequest instance.
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
   * @description Returns the API key for the Gemini service.
   * @returns {string} The API key.
   * @category Authentication
   */
  apiKey () {
    return GeminiService.shared().apiKey();
  }

  /**
   * @description Sets up the request for streaming.
   * @returns {GeminiRequest} The current instance.
   * @category Configuration
   */
  setupForStreaming () {
    return this;
  }

  /**
   * @description Prepares the request options for the API call.
   * @returns {Object} The request options.
   * @category Request Preparation
   */
  requestOptions () {
    const apiKey = this.apiKey();
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        'Accept-Encoding': 'identity'
      },
      body: JSON.stringify(this.bodyJson())
    };
  }

  /**
   * @description Sends the request and streams the response asynchronously.
   * @returns {Promise} A promise that resolves when the streaming is complete.
   * @category Request Handling
   */
  async asyncSendAndStreamResponse () {
    if (!this.isContinuation()) {
      this.jsonStreamReader().beginJsonStream();
    }
    return super.asyncSendAndStreamResponse();
  }

  /**
   * @description Reads the XHR lines and processes them through the JSON stream reader.
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
   * @description Checks if the request stopped due to reaching the maximum token limit.
   * @returns {boolean} Always returns false for this implementation.
   * @category Request State
   */
  stoppedDueToMaxTokens () {
    return false; // stopped due to max output tokens per request
  }

  /**
   * @description Handles errors from the JSON stream reader.
   * @param {JsonStreamReader} reader - The JSON stream reader instance.
   * @param {Error} error - The error that occurred.
   * @category Error Handling
   */
  onJsonStreamReaderError (reader, error) {
    this.setError(error);
    this.abort();
  }

  /**
   * @description Handles the popping of containers from the JSON stream reader.
   * @param {JsonStreamReader} reader - The JSON stream reader instance.
   * @param {Object} json - The JSON object that was popped.
   * @category Data Processing
   */
  onJsonStreamReaderPopContainer (reader, json) {
    if (reader.containerStack().length === 2) {
      this.onStreamJsonChunk(json);
    }
  }

  /**
   * @description Processes a chunk of JSON data from the stream.
   * @param {Object} json - The JSON chunk to process.
   * @category Data Processing
   */
  onStreamJsonChunk (json) {
    const candidates = json.candidates;

    if (candidates) {
      const candidate = candidates[0];
      if (candidate.content) {
        const text = candidate.content.parts[0].text;
        this.onNewContent(text);
      }

      if (candidate.finishReason) {
        if (candidate.finishReason !== "STOP") {
          console.warn("finishReason: ", candidate.finishReason);
          this.setStopReason(candidates.finishReason);
        }
      }

      if (candidate.safetyRatings) {
        console.log("candidate.safetyRatings: ", candidate.safetyRatings);
      }
    }

    if (json.usageMetadata) {
      this.setUsageOutputTokenCount(json.usageMetadata.totalTokenCount);
    }
  }

  /**
   * @description Returns a dictionary of stop reason codes and their descriptions.
   * @returns {Object} A dictionary of stop reasons.
   * @category Request State
   */
  stopReasonDict () {
    return {
      "FINISH_REASON_UNSPECIFIED": "Default value. This value is unused.",
      "STOP": "Natural stop point of the model or provided stop sequence.",
      "MAX_TOKENS": "The maximum number of tokens as specified in the request was reached.",
      "SAFETY": "The candidate content was flagged for safety reasons.",
      "RECITATION": "The candidate content was flagged for recitation reasons.",
      "OTHER": "Unknown reason."
    }
  }

  /**
   * @description Checks if the request stopped due to reaching the maximum token limit.
   * @returns {boolean} True if stopped due to max tokens, false otherwise.
   * @category Request State
   */
  stoppedDueToMaxTokens () {
    return this.stopReason() === "MAX_TOKENS";
  }

}).initThisClass();