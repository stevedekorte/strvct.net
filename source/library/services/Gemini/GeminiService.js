"use strict";

/* 
    GeminiService

    GeminiService is a BMSummaryNode that holds the API key and subnodes for the various Groq services.

    REST:

    POST https://LOCATION-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/publishers/google/models/MODEL_ID:GENERATE_RESPONSE_METHOD



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
    return "https://LOCATION-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/publishers/google/models/MODEL_ID:GENERATE_RESPONSE_METHOD";
  }
  */

  endPointUrlFormat () {
    return "https://generativelanguage.googleapis.com/v1beta/models/MODEL_ID:GENERATE_RESPONSE_METHOD?key=API_KEY";
  }

  setupChatEndpoint () {
    let url = this.endPointUrlFormat();
    url = url.replaceAll("LOCATION", this.locationId());
    url = url.replaceAll("PROJECT_ID", this.projectId());
    url = url.replaceAll("MODEL_ID", this.chatModel().modelName());
    url = url.replaceAll("GENERATE_RESPONSE_METHOD", "streamGenerateContent");
    url = url.replaceAll("API_KEY", this.apiKey());
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
    this.chatModel().setModelName("gemini-1.5-pro");
    this.chatModel().setMaxContextTokenCount(1000000); // wow!
  }
  */

  validateKey (s) {
    return s.startsWith("sk-");
  }

  hasApiKey () {
    return this.apiKey().length > 0; // && this.validateKey(this.apiKey());
  }

  chatRequestClass () {
    return GeminiRequest;
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
        firstMessage.content = "Please begin the game now.";
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
