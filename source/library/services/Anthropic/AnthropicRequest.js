"use strict";

/**
 * @module library.services.Anthropic
 */

/**
 * @class AnthropicRequest
 * @extends AiRequest
 * @classdesc Handles requests to the Anthropic API for AI interactions.
 *
 * Example request:
 *
 * curl https://api.anthropic.com/v1/messages \
 *  --header "anthropic-version: 2023-06-01" \
 *  --header "anthropic-beta: messages-2023-12-15" \
 *  --header "content-type: application/json" \
 *  --header "x-api-key: $ANTHROPIC_API_KEY" \
 *  --data \
 * '{
 *   "model": "claude-3-opus-20240229",
 *   "messages": [{"role": "user", "content": "Hello"}],
 *   "max_tokens": 256,
 *   "stream": true
 * }'
 *
 * Example response:
 *
 * {
 *   "completion": "Hello! How can I assist you today?",
 *   "stop_reason": "stop_sequence",
 *   "truncated": false,
 *   "log_id": "abc123", // the conversation id, used for continuation requests
 *   "usage": {
 *     "prompt_tokens": 10,
 *     "completion_tokens": 20,
 *     "total_tokens": 30
 *   }
 * }
 *
 * Continuation request:
 *
 * curl https://api.anthropic.com/v1/complete \
 *   -H "Content-Type: application/json" \
 *   -H "X-API-Key: YOUR_API_KEY" \
 *   -d '{
 *     "conversation_id": "abc123",
 *     "continuation": true,
 *     "parent_message_id": "def456"
 *   }'
 */
(class AnthropicRequest extends AiRequest {

  initPrototypeSlots () {
    /**
     * @property {Number} usageInputTokenCount - The number of input tokens used in the request.
     */
    {
      const slot = this.newSlot("usageInputTokenCount", 0);
      slot.setSlotType("Number");
    }

    /**
     * @property {Number} usageOutputTokenCount - The number of output tokens generated in the response.
     */
    {
      const slot = this.newSlot("usageOutputTokenCount", 0);
      slot.setSlotType("Number");
    }

    /**
     * @property {String} betaVersion - The beta version of the Anthropic API to use.
     */
    {
      const slot = this.newSlot("betaVersion", "tools-2024-05-16"); // "messages-2023-12-15"
      slot.setSlotType("NumbeStringr");
    }

  }

  /**
   * @description Initializes the AnthropicRequest instance.
   */
  init () {
    super.init();
    this.setIsDebugging(true);
  }

  /**
   * @description Retrieves the API key for Anthropic service.
   * @returns {String} The API key.
   */
  apiKey () {
    return AnthropicService.shared().apiKey();
  }

  /**
   * @description Prepares the request options for the Anthropic API call.
   * @returns {Object} The request options.
   */
  requestOptions () {
    const apiKey = this.apiKey();
    const json = {
      method: "POST",
      headers: {
        //"Content-Type": "application/json",
        "Content-Type": "application/json; charset=UTF-8",
        "anthropic-version": "2023-06-01",
        "anthropic-beta": this.betaVersion(),
        "x-api-key": apiKey,
        'Accept-Encoding': "identity",
        'anthropic-dangerous-direct-browser-access': true
      },
      body: JSON.stringify(this.bodyJson()),
    };
    return json;
  }

  /**
   * @description Sets up the request for streaming responses.
   * @returns {AnthropicRequest} The current instance.
   */
  setupForStreaming () {
    // subclasses should override this method to set up the request for streaming
    const body = this.bodyJson();
    body.stream = true;
    body.max_tokens = 4096; // current max output tokens allowed by anthropic (as of Claude 3 Opus)
    return this;
  }

  /**
   * @description Reads and processes the XHR response lines.
   */
  readXhrLines () {
    try {
      let line = this.readNextXhrLine();

      while (line !== undefined) {
        line = line.trim();
        //console.warn(this.type() + " readXhrLines() read line: [" + line + "]");

        if (line.length) {
          if (line.startsWith("data:")) {
            const s = line.after("data:");
            const json = JSON.parse(s);
            this.onStreamJsonChunk(json);
          } else if (line.startsWith("event:")) {
            // ingore
          } else {
            console.warn(this.type() + " WARNING: don't know what to do with this line: [" + line + "]");
            debugger;
          }
        }
        line = this.readNextXhrLine();
      }
    } catch (error) {
      this.onError(error);
      this.xhrPromise().callRejectFunc(new Error(error));      
    }
  }

  /**
   * @description Processes a JSON chunk from the stream response.
   * @param {Object} json - The JSON chunk to process.
   */
  onStreamJsonChunk (json) {
    const type = json.type;
    if (json.type === "error") {
      const error = new Error(json.error.message);
      error.name = json.error.type;
      this.onError(error);
      this.setStopReason(json.error.type);
      if (json.error.message === "Output blocked by content filtering policy") {
        //this.fullContent().copyToClipboard();
      }
      this.abort();
 //     debugger;
      return;
    } else if (type === "message_start") {
      // nothing to do?
      // example {"type": "message_start", "message": {"id": "msg_1nZdL29xx5MUA1yADyHTEsnR8uuvGzszyY", "type": "message", "role": "assistant", "content": [], 
      // "model": "claude-3-opus-20240229, "stop_reason": null, "stop_sequence": null, "usage": {"input_tokens": 25, "output_tokens": 1}}}
      if (json.message.usage) {
        this.setUsageInputTokenCount(json.message.usage.input_tokens);
      }
    } else if (type === "content_block_start") {
        this.onNewContent(json.content_block.text);
    } else if (type === "content_block_delta") {
      this.onNewContent(json.delta.text);
    } else if (type === "content_block_stop") {
      // nothing to do?
      // example: {"type": "content_block_stop", "index": 0}
    } else if (type === "message_delta") {
      // nothing to do?
      // example: {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence":null, "usage":{"output_tokens": 15}}}
      this.setStopReason(json.delta.stop_reason);
    } else if (type === "message_stop") {
      // example: {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence":null, "usage":{"output_tokens": 15}}}
      if (json.stop_reason) {
        this.setStopReason(json.stop_reason);
      } 
    } else if (json.delta) {
        if (json.delta.usage) {
          this.setUsageOutputTokenCount(json.delta.usage.output_tokens);
        }
        if (json.delta.stop_reason && json.delta.stop_reason !== "end_turn") {
          this.setStopReason(json.delta.stop_reason);
        }
    } else if (type === "ping") {
      // a keep alive message?
      // example: {"type": "message_stop"}
    } else {
      console.warn(this.type() + " WARNING: don't know what to do with this JsonChunk", json);
      debugger;
    }
  }

  /**
   * @description Returns a dictionary of stop reasons and their descriptions.
   * @returns {Object} The stop reason dictionary.
   */
  stopReasonDict () {
    /*
    {
    "invalid_request_error": "Indicates a problem with the format of your request to the API (incorrect parameters, invalid syntax, missing data, etc.).",
    "authentication_error": "Your API key is incorrect or invalid.",
    "permission_error": "Your API key lacks the permissions required for the endpoint/feature.",
    "not_found_error": "The requested resource (e.g., model) was not found.",
    "rate_limit_error": "You've exceeded the usage rate limit for your API key.",
    "overloaded_error": "Anthropic's systems are temporarily overloaded.",
    "api_error": "An unexpected internal error on Anthropic's side"
  }
  */

    return {
      "invalid_api_key_error": "The provided API key is invalid.",
      "invalid_model_error": "The specified model is invalid.",
      "insufficient_quota_error": "The account associated with the API key has insufficient quota for this request.",
      "user_rate_limited_error": "The user has sent too many requests and is being rate limited.",
      "server_overloaded_error": "The server is currently overloaded. Please try again later.",
      "bad_request_error": "The request is invalid or malformed.",
      "invalid_response_format_error": "The specified response format is invalid.",
      "invalid_temperature_error": "The specified temperature value is invalid. It must be a float between 0 and 1.",
      "invalid_max_tokens_error": "The specified max_tokens value is invalid. It must be a positive integer.",
      "invalid_stop_sequences_error": "The specified stop sequences are invalid.",
      "invalid_top_p_error": "The specified top_p value is invalid. It must be a float between 0 and 1.",
      "invalid_presence_penalty_error": "The specified presence_penalty value is invalid. It must be a float between -2.0 and 2.0.",
      "invalid_frequency_penalty_error": "The specified frequency_penalty value is invalid. It must be a float between -2.0 and 2.0.",
      "invalid_logit_bias_error": "The specified logit_bias is invalid.",
      "text_too_long_error": "The specified text input exceeds the maximum allowed length.",
      "invalid_stream_error": "The specified stream value is invalid. It must be a boolean.",
      "api_key_missing_error": "The API key is missing from the request.",
      "model_overloaded_error": "The specified model is currently overloaded. Please try again later.",
      "internal_server_error": "An unexpected internal server error occurred.",
      "service_unavailable_error": "The API service is currently unavailable.",

      // not sure above errors are correct

      "api_error": "A general API error occurred.",
      "overloaded_error": "Anthropic service overloaded",

      "invalid_request_error" : "Invalid request. Content may be blocked by filter policy.",
      "stop_sequence": "The model stopped because it encountered a stop sequence specified in the `stop` parameter of the API request. This is used to stop generation when a particular substring is encountered.",
      "max_tokens": "The model stopped because it reached the maximum number of tokens allowed for the response, as specified by the `max_tokens_to_sample` parameter in the API request.",
      "api_request": "The model stopped because the `/completions` API endpoint was called again with the same `conversation_id`, interrupting the previous generation.", 
      null: "If the model completed its generation normally without encountering a stop sequence, reaching the max tokens limit, or being interrupted, the `stop_reason` will be `null`."
    };
  }

  /**
   * @description Returns an array of stop reasons that are considered okay.
   * @returns {Array} The array of okay stop reasons.
   */
  okStopReasons () {
    return [null, "end_turn"];
  }
  
  /**
   * @description Checks if the request stopped due to reaching the maximum token limit.
   * @returns {Boolean} True if stopped due to max tokens, false otherwise.
   */
  stoppedDueToMaxTokens () {
    return this.stopReason() === "max_tokens";
  }

  /**
   * @description Returns a set of stop reasons that can be retried.
   * @returns {Set} The set of retriable stop reasons.
   */
  retriableStopReasons () {
    return new Set(["overloaded_error", "server_overloaded_error", "service_unavailable_error"]);
  }

  /**
   * @description Handles the XHR load end event.
   * @param {Event} event - The XHR load end event.
   * @returns {*} The result of the parent class's onXhrLoadEnd method.
   */
  onXhrLoadEnd (event) {
    const s = this.xhr().responseText;
    if (s.endsWith("Internal Server Error")) {
      this.setStopReason("internal_server_error");
      this.setStopError(new Error("Anthropic Internal Server Error"));
    }
    return super.onXhrLoadEnd(event);
  }

}).initThisClass();