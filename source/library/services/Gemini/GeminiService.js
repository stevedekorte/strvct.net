"use strict";

/* 
    GeminiService

    GeminiService is a BMSummaryNode that holds the API key and subnodes for the various Groq services.

    REST:

    POST https://{location id}-aiplatform.googleapis.com/v1/projects/{project id}/locations/{location id}/publishers/google/models/{model id}:{generate response method}



    Example:

    GeminiService.shared().setApiKey("sk-1234567890");
    const hasApiKey = GeminiService.shared().hasApiKey();


    Models:

        Model ID: gemini-1.5-pro
        Max total tokens (input and output): 1M
        Max output tokens: 8,192

        Model ID: gemini-1.0-pro
        Max total tokens (input and output): 32,760
        Max output tokens: 8,192

*/

(class GeminiService extends AiService {

  static initClass () {
    this.setIsSingleton(true);
    return this;
  }
  
  initPrototypeSlots () {
    {
      const slot = this.newSlot("projectId", null);
    }

    {
      const slot = this.newSlot("locationId", null);
    }
  }

  init () {
    super.init();
  }

  /*
  requestOptions () {
    const options = super.requestOptions();
  }
  */

  /*
  endPointUrlFormat () {
    return "https://{location id}-aiplatform.googleapis.com/v1/projects/{project id}/locations/{location id}/publishers/google/models/{model id}:{generate response method}";
  }
  */

  endPointUrlFormat () {
    return "https://generativelanguage.googleapis.com/v1beta/models/{model id}:{generate response method}?key={api key}";
  }

  setupChatEndpoint () {
    let url = this.endPointUrlFormat();
    //url = url.replaceAll("{location id}", this.locationId());
    //url = url.replaceAll("{project id}", this.projectId());
    url = url.replaceAll("{model id}", this.defaultChatModel().modelName());
    url = url.replaceAll("{generate response method}", "streamGenerateContent");
    url = url.replaceAll("{api key}", this.apiKey());
    this.setChatEndpoint(url);
  }

  finalInit () {
    super.finalInit()
    this.setTitle("Gemini");

    this.setSystemRoleName(null); // only replaced in outbound request json
    this.setUserRoleName("USER");
    this.setAssistantRoleName("MODEL");

    this.setChatEndpoint(null);
    //this.setupDefault();
    this.setSystemRoleName("user"); // only replaced in outbound request json
  }

  /*
  setupDefault () {
    this.defaultChatModel().setModelName("gemini-1.5-pro");
    this.defaultChatModel().setMaxContextTokenCount(1000000); // wow!
  }
  */

  validateKey (s) {
    return s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0; // && this.validateKey(this.apiKey());
  }

  validateKey (token) {
    /*
    // 1. Split on Dots:
    const tokenParts = token.split('.');

    // 2. Check for Three Parts:
    if (tokenParts.length !== 3) {
      return false; // A JWT must have header, payload, and signature
    }

    // 3. Validate Base64URL Encoding:
    const isValidEncoding = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(token);

    // 4. Combined Result:
    return isValidEncoding;
    */
  }


  setupFromInfo () {
    super.setupFromInfo();

    const info = this.serviceInfo();

    if (info.locationId) {
      this.setLocationId(info.locationId);
    }

    if (info.projectId) {
      this.setProjectId(info.projectId);
    }

    //debugger;
    this.setupChatEndpoint();
  }

  /*
  {
  "contents": [
    {
      "role": "USER",
      "parts": { "text": "Hello!" }
    },
    {
      "role": "MODEL",
      "parts": { "text": "Argh! What brings ye to my ship?" }
    },
    {
      "role": "USER",
      "parts": { "text": "Wow! You are a real-life priate!" }
    }
  ],
  "safety_settings": {
    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "threshold": "BLOCK_LOW_AND_ABOVE"
  },
  "generation_config": {
    "temperature": 0.2,
    "topP": 0.8,
    "topK": 40,
    "maxOutputTokens": 200,
  }
}
*/

  prepareToSendRequest (aRequest) {
    const bodyJson = aRequest.bodyJson();
    const geminiBody = {};

    geminiBody.safety_settings = {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "threshold": "BLOCK_LOW_AND_ABOVE"
    }

    geminiBody.generation_config = {
      "temperature": bodyJson.temperature,
      "topP": bodyJson.top_p,
      "topK": 40,
      "maxOutputTokens": 100000,
    }

    let messages = bodyJson.messages;
    
    // remove initial system message and place it in the request json

    if (messages.length > 0) {
      const firstMessage = messages.first();
      if (firstMessage.role === this.systemRoleName()) {
        bodyJson.system_instruction = {
          parts: [ 
            { 
              text: firstMessage.content
            }
          ]
        }
        firstMessage.content = "Please begin the game now. Remember to use the content-warning tag where appropriate.";
        //messages.shift();
      }
    }

    geminiBody.contents = messages.map((message) => {
      return {
        role: message.role,
        parts: { 
          text: message.content 
        }
      }
    });

    // remove messages with empy content
    messages = messages.filter((message) => { return message.content.length > 0; });

    aRequest.setBodyJson(geminiBody);
  }


}.initThisClass());
