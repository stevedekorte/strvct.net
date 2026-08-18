"use strict";

/**
 * @module library.services.Xai
 */

/**
 * @class SvXaiRequest
 * @extends SvOpenAiRequest
 * @classdesc
 * SvXaiRequest class for handling API requests to Xai.
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
    "model": "grok-4.6",
    "stream": true,
    "temperature": 0
  }'


  Example streaming response:

  {
  "id": "304e12ef-81f4-4e93-a41c-f5f57f6a2b56",
  "object": "chat.completion",
  "created": 1728511727,
  "model": "grok-4.6",
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

(class SvXaiRequest extends SvOpenAiRequest {

    /**
   * @description Initializes prototype slots for the SvXaiRequest class.
   * @category Initialization
   */
    initPrototypeSlots () {
    }

    /**
   * @description Initializes the SvXaiRequest instance.
   * @category Initialization
   */
    init () {
        super.init();
        this.setIsDebugging(true);
        this.setIsStreaming(true);
    }

    /**
   * @description Sets up the request for streaming.
   * @returns {SvXaiRequest} The current SvXaiRequest instance.
   * @category Configuration
   */
    setupForStreaming () {
    // subclasses should override this method to set up the request for streaming
        const body = this.bodyJson();
        body.stream = true;
        // Without this the stream carries NO usage object at all, so the
        // billing proxy cannot settle actual cost (incl. the cached_tokens
        // discount) and falls back to the estimate — observed 2026-08-18 as
        // ~$2.20/request debits on grok-4.6 with fictional output tokens.
        body.stream_options = { include_usage: true };
        // Same grok-4.6 model, faster scheduling lane. xAI bills 2x only when
        // the response confirms service_tier: "priority".
        body.service_tier = "priority";
        // Default is "high" and cannot be disabled. Low is the documented
        // setting for latency-sensitive tool calling (GM turns).
        body.reasoning_effort = "low";
        //body.max_tokens = this.outputTokenLimit(); // current max output tokens allowed by Xai
        return this;
    }

    async requestOptions () {
        const options = await super.requestOptions();
        const convId = this.grokConvId();
        if (convId) {
            options.headers["x-grok-conv-id"] = convId;
        }
        return options;
    }

    grokConvId () {
        const delegate = this.delegate();
        const conversation = delegate && typeof delegate.conversation === "function"
            ? delegate.conversation()
            : null;
        if (conversation && typeof conversation.jsonId === "function" && conversation.jsonId()) {
            return conversation.jsonId();
        }
        return null;
    }

}).initThisClass();
