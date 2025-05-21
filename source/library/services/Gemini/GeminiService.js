"use strict";

/**
 * @module library.services.Gemini
 */

/**
 * @class GeminiService
 * @extends AiService
 * @classdesc GeminiService is a SvSummaryNode that holds the API key and subnodes for the various Groq services.
 * 
 * REST:
 * 
 * POST https://{location id}-aiplatform.googleapis.com/v1/projects/{project id}/locations/{location id}/publishers/google/models/{model id}:{generate response method}
 * 
 * Example:
 * 
 * GeminiService.shared().setApiKey("sk-1234567890");
 * const hasApiKey = GeminiService.shared().hasApiKey();
 * 
 * Models:
 * 
 *     Model ID: gemini-1.5-pro
 *     Max total tokens (input and output): 1M
 *     Max output tokens: 8,192
 * 
 *     Model ID: gemini-1.0-pro
 *     Max total tokens (input and output): 32,760
 *     Max output tokens: 8,192
 */
(class GeminiService extends AiService {

  /**
   * @static
   * @description Initializes the class by setting it as a singleton.
   * @category Initialization
   */
  static initClass () {
    this.setIsSingleton(true);
  }

  /**
   * @description Returns the JSON representation of available models.
   * @returns {Array} An array of model objects.
   * @category Model Management
   */
  modelsJson () {
    return [
      {
        "name": "gemini-2.5-pro-preview-05-06",
        "title": "Gemini 2.5 Pro Preview (I/O Edition)",
        "inputTokenLimit": 1048576,
        "outputTokenLimit": 65536
      }
      /*
      // these other models may not be good enough to work properly
      {
        "name": "gemini-2.5-pro-preview-03-25",
        "title": "Gemini 2.5 Pro Preview",
        "inputTokenLimit": 1048576,
        "outputTokenLimit": 65536
      },
      {
        "name": "gemini-2.5-flash-preview-04-17",
        "title": "Gemini 2.5 Flash Preview",
        "inputTokenLimit": 1048576,
        "outputTokenLimit": 65536
      },
      {
        "name": "gemini-2.0-flash",
        "title": "Gemini 2.0 Flash",
        "inputTokenLimit": 1048576,
        "outputTokenLimit": 8192
      }
      */
    ];
  }

  serviceInfo () {
    // need these to construct the endpoint url
    return {
      "projectId": "precise-blend-419917",
      "locationId": "us-central1"
    };
  }
  
  /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {String} projectId
     * @category Configuration
     */
    {
      const slot = this.newSlot("projectId", null);
      slot.setSlotType("String");
      slot.setShouldStoreSlot(true);
    }

    /**
     * @member {String} locationId
     * @category Configuration
     */
    {
      const slot = this.newSlot("locationId", null);
      slot.setSlotType("String");
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("textToVideo", null);
      slot.setFinalInitProto(GeminiVideoPrompts);
      slot.setIsSubnode(true);
      slot.setShouldStoreSlot(true);
    }

  }

  /**
   * @description Initializes the instance.
   * @category Initialization
   */
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

  /**
   * @description Returns the endpoint URL format.
   * @returns {string} The endpoint URL format.
   * @category API Communication
   */
  endPointUrlFormat () {
    return "https://generativelanguage.googleapis.com/v1beta/models/{model id}:{generate response method}?key={api key}";
  }

  /**
   * @description Sets up the chat endpoint URL.
   * @category API Communication
   */
  setupChatEndpoint () {
    let url = this.endPointUrlFormat();
    url = url.replaceAll("{model id}", this.defaultChatModel().modelName());
    url = url.replaceAll("{generate response method}", "streamGenerateContent");
    url = url.replaceAll("{api key}", this.apiKeyOrUserAuthToken());
    this.setChatEndpoint(url);
  }

  /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
  finalInit () {
    super.finalInit()
    this.setTitle(this.type().before("Service"));

    this.setUserRoleName("user");
    this.setAssistantRoleName("model");
    this.setSystemRoleName("system");
  }

  /*
  setupDefault () {
    this.defaultChatModel().setModelName("gemini-1.5-pro");
    this.defaultChatModel().setInputTokenLimit(1000000); // wow!
  }
  */

  /**
   * @description Validates the API key.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the API key is valid, false otherwise.
   * @category Authentication
   */
  validateKey (s) {
    return s.startsWith("sk-");
  }

  /**
   * @description Sets up the service from the provided information.
   * @category Configuration
   */
  setupFromInfo () {
    super.setupFromInfo();

    const info = this.serviceInfo();

    if (info.locationId) {
      this.setLocationId(info.locationId);
    }

    if (info.projectId) {
      this.setProjectId(info.projectId);
    }

    this.setupChatEndpoint();
  }

  /*

  curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works"
          }
        ]
      }
    ],
    "generationConfig": {
      "stopSequences": [
        "Title"
      ],
      "temperature": 1.0,
      "maxOutputTokens": 800,
      "topP": 0.8,
      "topK": 10
    }
  }'
  */

  /**
   * @description Prepares the request before sending it.
   * @param {Object} aRequest - The request object to prepare.
   * @category API Communication
   */
  prepareToSendRequest (aRequest) {
    this.setupChatEndpoint(); // in case user's auth token has changed

    //debugger;
    const bodyJson = aRequest.bodyJson();
    const geminiBody = {};

    geminiBody.safety_settings = [
      {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
      {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
      {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"}
    ];

    geminiBody.generation_config = {
      "temperature": bodyJson.temperature,
      "topP": bodyJson.top_p,
      "topK": 40
      //"maxOutputTokens": 100000,
    }

    let messages = bodyJson.messages;
    
    // remove initial system message and place it in the request json

    //debugger;
    if (messages.length > 0) {
      const firstMessage = messages.first();
      if (firstMessage.role === this.systemRoleName()) {
        geminiBody.system_instruction = {
          parts: [ 
            { 
              text: firstMessage.content
            }
          ]
        };
        firstMessage.role = this.userRoleName();
        firstMessage.content = "Please begin the conversation now.";
      }
    }

    //assert(geminiBody.system_instruction, "System instruction is required");

    geminiBody.contents = messages.map((message) => {
      let role = message.role.toLowerCase();
      assert([this.assistantRoleName(), this.userRoleName()].includes(role), "Invalid message role: " + message.role);
      return {
        role: role,
        parts: { 
          text: message.content 
        }
      };
    });
    //debugger;

    // remove messages with empy content
    messages = messages.filter((message) => { return message.content.length > 0; });

    //console.log("geminiBody", JSON.stringify(geminiBody, null, 2));
    //debugger;
  
    aRequest.setBodyJson(geminiBody);
  }

}.initThisClass());