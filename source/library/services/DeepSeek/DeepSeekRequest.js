"use strict";

/**
 * @module library.services.DeepSeek
 */

/**
 * @class DeepSeekRequest
 * @extends OpenAiRequest
 * @classdesc
 * DeepSeekRequest class for handling API requests to DeepSeek.
 * 
 * Example request:
 * 
 * curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
 *  -H "Authorization: Bearer $GROQ_API_KEY" \
 *  -H "Content-Type: application/json" \
 *  -d '{"messages": [{"role": "user", "content": "Explain the importance of low latency LLMs"}], "model": "mixtral-8x7b-32768"}'
 */
(class DeepSeekRequest extends OpenAiRequest {

  /**
   * @description Initializes prototype slots for the DeepSeekRequest class.
   * @category Initialization
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the DeepSeekRequest instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setIsDebugging(true);
  }

  /**
   * @description Retrieves the API key for DeepSeek service.
   * @returns {string} The API key for DeepSeek service.
   * @category Authentication
   */
  apiKey () {
    return DeepSeekService.shared().apiKey();
  }

  /**
   * @description Sets up the request for streaming.
   * @returns {DeepSeekRequest} The current DeepSeekRequest instance.
   * @category Configuration
   */
  setupForStreaming () {
    // subclasses should override this method to set up the request for streaming
    const body = this.bodyJson();
    body.stream = true;
    body.max_tokens = this.model().outputTokenLimit(); // current max output tokens allowed by Groq
    return this;
  }

}).initThisClass();