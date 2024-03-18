"use strict";

/* 
    AnthropicRequest

    Example request:


    curl https://api.anthropic.com/v1/messages \
     --header "anthropic-version: 2023-06-01" \
     --header "anthropic-beta: messages-2023-12-15" \
     --header "content-type: application/json" \
     --header "x-api-key: $ANTHROPIC_API_KEY" \
     --data \
    '{
      "model": "claude-3-opus-20240229",
      "messages": [{"role": "user", "content": "Hello"}],
      "max_tokens": 256,
      "stream": true
    }'

    Example response:

    {
      "completion": "Hello! How can I assist you today?",
      "stop_reason": "stop_sequence",
      "truncated": false,
      "log_id": "abc123", // the conversation id, used for continuation requests
      "usage": {
        "prompt_tokens": 10,
        "completion_tokens": 20,
        "total_tokens": 30
      }
    }

    Contniuation request:

    curl https://api.anthropic.com/v1/complete \
      -H "Content-Type: application/json" \
      -H "X-API-Key: YOUR_API_KEY" \
      -d '{
        "conversation_id": "abc123",
        "continuation": true,
        "parent_message_id": "def456"
      }'

*/

(class AnthropicRequest extends AiRequest {

  initPrototypeSlots() {
  }

  init () {
    super.init();
    this.setIsDebugging(true);
  }

  apiKey () {
    return AnthropicService.shared().apiKey();
  }

  requestOptions () {
    const apiKey = this.apiKey();
    return {
      method: "POST",
      headers: {
        //"Content-Type": "application/json",
        "Content-Type": "application/json; charset=UTF-8",
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "messages-2023-12-15",
        "x-api-key": apiKey,
        'Accept-Encoding': 'identity'
      },
      body: JSON.stringify(this.bodyJson()),
    };
  }

  setupForStreaming () {
    // subclasses should override this method to set up the request for streaming
    const body = this.bodyJson();
    body.stream = true;
    body.max_tokens = 4096; // current max output tokens allowed by anthropic
    return this;
  }

   // --- streaming ---

  readXhrLines () {
    try {
      let line = this.readNextXhrLine();

      while (line !== undefined) {
        line = line.trim();

        if (line.length) {
          if (line.startsWith("data:")) {
            const s = line.after("data:");
            const json = JSON.parse(s);
            this.onStreamJsonChunk(json);
          } 

        }
        line = this.readNextXhrLine();
      }
    } catch (error) {
      this.onError(error);
      console.warn(this.type() + " ERROR:", error);
      this.xhrPromise().callRejectFunc(new Error(error));      
    }
  }

  onStreamJsonChunk (json) {
    const type = json.type;
    if (json.type === "error") {
      console.warn("ERROR: " + json.error.message);
      this.xhrPromise().callRejectFunc(new Error(json.error.message));
    } else if (type === "message_start") {
      // nothing to do?
      // example {"type": "message_start", "message": {"id": "msg_1nZdL29xx5MUA1yADyHTEsnR8uuvGzszyY", "type": "message", "role": "assistant", "content": [], 
      // "model": "claude-3-opus-20240229, "stop_reason": null, "stop_sequence": null, "usage": {"input_tokens": 25, "output_tokens": 1}}}
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
      // nothing to do?
      // example: {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence":null, "usage":{"output_tokens": 15}}}
      if (json.stop_reason) {
        this.setStopReason(json.stop_reason);
      } else if (json.delta && json.delta.stop_reason) {
        this.setStopReason(json.delta.stop_reason);
      }
    } else if (type === "ping") {
      // nothing to do?
      // example: {"type": "message_stop"}
      //this.setStopReason("complete");
    } else {
      console.warn(this.type() + " WARNING: don't know what to do with this JsonChunk", json);
      debugger;
    }
  }

  stopReasonDict () {
    return {
      "stop_sequence": "The model stopped because it encountered a stop sequence specified in the `stop` parameter of the API request. This is used to stop generation when a particular substring is encountered.",
      "max_tokens": "The model stopped because it reached the maximum number of tokens allowed for the response, as specified by the `max_tokens_to_sample` parameter in the API request.",
      "api_request": "The model stopped because the `/completions` API endpoint was called again with the same `conversation_id`, interrupting the previous generation.", 
      null: "If the model completed its generation normally without encountering a stop sequence, reaching the max tokens limit, or being interrupted, the `stop_reason` will be `null`."
    };
  }

  stoppedDueToMaxTokens () {
    return this.stopReason() === "max_tokens";
  }

}).initThisClass();
