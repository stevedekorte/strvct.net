"use strict";

/**
 * @module library.services.Groq
 */

/**
 * @class GroqRequest
 * @extends OpenAiRequest
 * @classdesc
 * GroqRequest class for handling API requests to Groq.
 * 
 * Example request:
 * 
 * curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
 *  -H "Authorization: Bearer $GROQ_API_KEY" \
 *  -H "Content-Type: application/json" \
 *  -d '{"messages": [{"role": "user", "content": "Explain the importance of low latency LLMs"}], "model": "mixtral-8x7b-32768"}'
 */
(class GroqRequest extends OpenAiRequest {

  /**
   * @description Initializes prototype slots for the GroqRequest class.
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the GroqRequest instance.
   */
  init () {
    super.init();
    this.setIsDebugging(true);
  }

  /**
   * @description Retrieves the API key for Groq service.
   * @returns {string} The API key for Groq service.
   */
  apiKey () {
    return GroqService.shared().apiKey();
  }

  /**
   * @description Sets up the request for streaming.
   * @returns {GroqRequest} The current GroqRequest instance.
   */
  setupForStreaming () {
    // subclasses should override this method to set up the request for streaming
    const body = this.bodyJson();
    body.stream = true;
    body.max_tokens = 4096; // current max output tokens allowed by Groq
    return this;
  }

}).initThisClass();