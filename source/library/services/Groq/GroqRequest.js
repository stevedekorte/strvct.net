"use strict";

/* 
    GroqRequest

    Example request:

    curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
     -H "Authorization: Bearer $GROQ_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Explain the importance of low latency LLMs"}], "model": "mixtral-8x7b-32768"}'

*/

(class GroqRequest extends OpenAiRequest {

  initPrototypeSlots () {
  }

  init () {
    super.init();
    this.setIsDebugging(true);
  }

  apiKey () {
    return GroqService.shared().apiKey();
  }

  setupForStreaming () {
    // subclasses should override this method to set up the request for streaming
    const body = this.bodyJson();
    body.stream = true;
    body.max_tokens = 4096; // current max output tokens allowed by Groq
    return this;
  }

}).initThisClass();
