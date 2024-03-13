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

    Delegate protocol:

      onRequestBegin(request)
      onRequestComplete(request)
      onRequestError(request, error)



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
        "Content-Type": "application/json",
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
    body.max_tokens = 2000;
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
      this.setFinishReason(json.delta.stop_reason);
    } else if (type === "message_stop") {
      // nothing to do?
      // example: {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence":null, "usage":{"output_tokens": 15}}}
      if (json.stop_reason) {
        this.setFinishReason(json.stop_reason);
      } else if (json.delta && json.delta.stop_reason) {
        this.setFinishReason(json.delta.stop_reason);
      }
    } else if (type === "ping") {
      // nothing to do?
      // example: {"type": "message_stop"}
      //this.setFinishReason("complete");
    } else {
      console.warn(this.type() + " WARNING: don't know what to do with this JsonChunk", json);
      debugger;
    }
  }

  onNewContent (newContent) {
    this.setFullContent(this.fullContent() + newContent);
    this.streamTarget().onStreamData(this, newContent);
  }

}).initThisClass();
