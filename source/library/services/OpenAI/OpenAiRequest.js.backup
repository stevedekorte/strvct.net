"use strict";

/* 
    OpenAiRequest

    request:

    curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "usage": true
  }'


    response: 

    {
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-3.5-turbo-0301",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}

*/

(class OpenAiRequest extends AiRequest {

  initPrototypeSlots () {

  }

  init () {
    super.init();
    this.setIsDebugging(true);
  }

  apiKey () {
    return OpenAiService.shared().apiKey();
  }

  requestOptions () {
    const apiKey = this.apiKey();
    const bodyJson = this.bodyJson();
    bodyJson.stream = true;
    //bodyJson.usage = true;
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Type": "application/json; charset=UTF-8",
        "Authorization": `Bearer ${apiKey}`,
        'Accept-Encoding': 'identity', // to avoid dealing with gzip
      },
      body: JSON.stringify(this.bodyJson()),
    };
  }

   // --- streaming ---

  readXhrLines () {
    try {
      let line = this.readNextXhrLine();
      
      //console.log("LINE: " + line);

      while (line !== undefined) {
        line = line.trim()
        if (line.length) {
          if (line.startsWith("data:")) {
            const s = line.after("data:");
            if (line.includes("[DONE]")) {
              // skip, stream is done and will close
              const errorFinishReasons = ["length", "content_filter", null];
              if (errorFinishReasons.includes(this.stopReason())) {
                this.setError("finish reason: '" + this.stopReason() + "'");
              }
            } else {
              // we should expect json
              //console.log("LINE: " + s)
              const json = JSON.parse(s);
              this.onStreamJsonChunk(json);
            }
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
    if (json.error) {
      console.warn("ERROR: " + json.error.message);
      this.xhrPromise().callRejectFunc(new Error(json.error.message));
    } else if (
        json.choices &&
        json.choices.length > 0
      ) {
        const choice = json.choices[0];
        const stopReason = choice.finish_reason;

        if (choice.delta && choice.delta.content) {
          const newContent = choice.delta.content;
          this.onNewContent(newContent);
          //console.warn("CONTENT: ", newContent);
        }

        if (stopReason) {
          //debugger;
          this.setStopReason(stopReason);
        }
    } else {
      if (json.id) {
        //console.warn("HEADER: ", JSON.stringify(json));
        // this is the header chunk - do we need to keep this around?
      } else {
        console.warn("WARNING: don't know what to do with this JsonChunk", json);
      }
    }
  }

  // --- finish reason ---

  okStopReasons () {
    return [null, "stop"];
  }

  stopReasonDict () {
    return {
      "stop": "Natural end or encountered user specified stop sequence.",
      "length": "The response reached the specified maximum number of tokens.",
      "null": "Likely an internal error or issue. If you encounter this frequently, it's best to contact OpenAI support." 
    }
  }

  stoppedDueToMaxTokens () {
    const b = this.stopReason() === "length";
    if (b) {
      debugger;
    }
    return b;
  }

}).initThisClass();
