"use strict";

/**
 * @module library.services.Xai
 */

/**
 * @class XaiRequest
 * @extends OpenAiRequest
 * @classdesc
 * XaiRequest class for handling API requests to Xai.
 * 
 * Example streaming request:

curl https://api.x.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -d '{
    "messages": [
      {
        "role": "system",
        "content": "You are Grok, a chatbot inspired by the Hitchhikers Guide to the Galaxy."
      },
      {
        "role": "user",
        "content": "What is the answer to life and universe?"
      }
    ],
    "model": "grok-beta",
    "stream": true,
    "temperature": 0
  }'


  Example streaming response:

  {
  "id": "304e12ef-81f4-4e93-a41c-f5f57f6a2b56",
  "object": "chat.completion",
  "created": 1728511727,
  "model": "grok-beta",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The "
      },
      "finish_reason": ""
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 1,
    "total_tokens": 25
  },
  "system_fingerprint": "fp_3813298403"
}


 */

(class XaiRequest extends OpenAiRequest {

  /**
   * @description Initializes prototype slots for the XaiRequest class.
   * @category Initialization
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the XaiRequest instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setIsDebugging(true);
  }

  /**
   * @description Retrieves the API key for Xai service.
   * @returns {string} The API key for Xai service.
   * @category Authentication
   */
  apiKey () {
    return XaiService.shared().apiKey();
  }

  /**
   * @description Sets up the request for streaming.
   * @returns {XaiRequest} The current XaiRequest instance.
   * @category Configuration
   */
  setupForStreaming () {
    // subclasses should override this method to set up the request for streaming
    const body = this.bodyJson();
    body.stream = true;
    //body.max_tokens = this.outputTokenLimit(); // current max output tokens allowed by Xai
    return this;
  }

}).initThisClass();