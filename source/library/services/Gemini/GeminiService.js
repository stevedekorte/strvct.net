"use strict";

/**
 * @module library.services.Gemini
 */

/**
 * @class GeminiService
 * @extends AiService
 * @classdesc GeminiService manages classes related to the Google Gemini and Vertex AI APIs.
 *
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

    static _serviceInfoJson = {
        "projectId": null,
        "locationId": "us-central1"
    };

    /**
   * @description Returns the JSON representation of available models.
   * @returns {Array} An array of model objects.
   * @category Model Management
   */
    modelsJson () {
        return [
            {
                "name": "gemini-3-flash-preview",
                "title": "Gemini 3.0 Flash Preview",
                "inputTokenLimit": 1048576,
                "outputTokenLimit": 65536
            },
            {
                "name": "gemini-3-pro-preview",
                "title": "Gemini 3.0 Pro Preview",
                "inputTokenLimit": 1048576,
                "outputTokenLimit": 65536
            },
            /*
            {
                "name": "gemini-2.5-pro",
                "title": "Gemini 2.5 Pro",
                "inputTokenLimit": 1048576,
                "outputTokenLimit": 65536
            },
            */
            {
                "name": "gemini-2.5-flash-lite",
                "title": "Gemini 2.5 Flash",
                "inputTokenLimit": 1048576,
                "outputTokenLimit": 65536
            }
        ];
    }

    serviceInfo () {
        return this.thisClass()._serviceInfoJson;
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
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
        }

        /**
     * @member {String} locationId
     * @category Configuration
     */
        {
            const slot = this.newSlot("locationId", null);
            slot.setAllowsNullValue(true);
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
   * @description Returns the chat endpoint URL with API key.
   * @category API Communication
   */
    async getChatEndpointWithKey () {
        let url = this.endPointUrlFormat();
        url = url.replaceAll("{model id}", this.defaultChatModel().modelName());
        url = url.replaceAll("{generate response method}", "streamGenerateContent");

        // Only include API key in URL if it's an actual Gemini API key (not a Firebase token)
        const apiKey = await this.apiKeyOrUserAuthToken();
        if (apiKey && !apiKey.startsWith("eyJ")) {
            // Real API keys don't start with eyJ (which is the start of a JWT)
            url = url.replaceAll("{api key}", apiKey);
        } else {
            // Remove the key parameter entirely when using proxy auth
            // First remove the entire key parameter including the ? or &
            if (url.includes("?key={api key}")) {
                url = url.replace("?key={api key}", "");
            } else if (url.includes("&key={api key}")) {
                url = url.replace("&key={api key}", "");
            }
        }

        return url;
    }

    /**
   * @description Returns the chat endpoint URL (without API key for display).
   * @category API Communication
   */
    chatEndpoint () {
    // Return URL without API key for display purposes
        let url = this.endPointUrlFormat();
        url = url.replaceAll("{model id}", this.defaultChatModel().modelName());
        url = url.replaceAll("{generate response method}", "streamGenerateContent");
        url = url.replaceAll("{api key}", "[API_KEY]");
        return url;
    }

    /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setTitle(this.svType().before("Service"));

        this.setUserRoleName("user");
        this.setAssistantRoleName("model");
        this.setSystemRoleName("system");
    }

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

        // Note: setupChatEndpoint is now async, will be called in prepareToSendRequest
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
    // Chat endpoint is now built dynamically in getChatEndpointWithKey()


        const bodyJson = aRequest.bodyJson();
        const geminiBody = {};

        geminiBody.safety_settings = [
            { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH" },
            { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH" },
            { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH" }
        ];

        geminiBody.generation_config = {
            "temperature": bodyJson.temperature,
            "topP": bodyJson.top_p,
            "topK": 40
            //"maxOutputTokens": 100000,
        };

        let messages = bodyJson.messages;

        // remove initial system message and place it in the request json


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


        // remove messages with empy content
        messages = messages.filter((message) => { return message.content.length > 0; });

        //console.log("geminiBody", JSON.stringify(geminiBody, null, 2));

        aRequest.setBodyJson(geminiBody);
    }

}.initThisClass());
