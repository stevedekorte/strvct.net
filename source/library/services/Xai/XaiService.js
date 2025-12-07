"use strict";

/**
 * @module library.services.Xai
 */

/**
 * @class XaiService
 * @extends AiService
 * @classdesc XaiService
 *
 * NOTES: Grok doesn't require alternate user and assistant roles, so we don't need to merge messages like Xai does.
 * - No docs on whether system messages must be placed at the beginning of the messages array.
*/

(class XaiService extends AiService {

    /**
   * @static
   * @description Initializes the class as a singleton.
   * @category Initialization
   */
    static initClass () {
        this.setIsSingleton(true);
    }

    serviceInfo () {
        return {
            "chatEndpoint": "https://api.x.ai/v1/chat/completions"
        };
    }

    /**
   * @description Returns an array of model configurations.
   * @returns {Array<Object>} An array of model configuration objects.
   * @category Configuration
   */
    modelsJson () {
        return [
            {
                "name": "grok-4-latest",
                "title": "Grok 4",
                "inputTokenLimit": 256000,
                "outputTokenLimit": 256000
            },
            {
                "name": "grok-4-1-fast-reasoning",
                "title": "Grok 4.1 Fast Reasoning",
                "inputTokenLimit": 131072,
                "outputTokenLimit": 16384
            },
            {
                "name": "grok-4-1-fast-non-reasoning",
                "title": "Grok 4.1 Fast Non-Reasoning",
                "inputTokenLimit": 131072,
                "outputTokenLimit": 16384
            }
            /*
      // these other models may not be good enough to work properly
      {
        "name": "grok-3-mini",
        "title": "Grok 3 Mini",
        "inputTokenLimit": 131072,
        "outputTokenLimit": 16384 // just a guess as I can't find it in the docs
      },
      {
        "name": "grok-2-latest",
        "title": "Grok 2 Latest",
        "inputTokenLimit": 131072,
        "outputTokenLimit": 8192 // jsut a guess as I can't find it in the docs
      }
      */
        ];
    }

    /**
   * @description Initializes the prototype slots.
   * @category Initialization
   */
    initPrototypeSlots () {
    }

    /**
   * @description Initializes the service.
   * @category Initialization
   */
    init () {
        super.init();
    }

    /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setTitle("xAi");
    //this.setSystemRoleName("user"); // only replaced in outbound request json // we now move this message into the system property
    }

    /**
   * @description Validates the API key format.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the API key is valid, false otherwise.
   * @category Authentication
   */
    validateKey (/*s*/) {
        return true;
    }

    /**
   * @description Prepares the request before sending it to the API.
   * @param {Object} aRequest - The request object to prepare.
   * @returns {XaiService} The service instance.
   * @category Request Handling
   */
    prepareToSendRequest (/*aRequest*/) {
    /*
    const bodyJson = aRequest.bodyJson();
    let messages = bodyJson.messages;

    // remove initial system message and place it in the request json

    if (messages.length > 0) {
      const firstMessage = messages.first();
      if (firstMessage.role === this.systemRoleName()) {
        bodyJson.system = firstMessage.content;
        //firstMessage.content = "Please begin the game now. Remember to not make action decisions for the players, to use roll requests (instead of making up roll results), and to ask for initiative rolls before combat.";
        firstMessage.content = "Please begin our session now.";
        //messages.shift();
      }
    }

    // remove messages with empy content
    messages = messages.filter((message) => { return message.content.length > 0; });

    // merge messages in order to ensure messages alternate between user and assistant roles

    const newMessages = [];
    let lastRole = null;
    let mergedMessageCount = 0;
    messages.forEach((message) => {
      if (message.role === "system") {
        message.role = this.userRoleName(); //  need to do this now that we're using the system property
      }
      if (message.role === lastRole) {
        const lastMessage = newMessages.last();
        //lastMessage.content += "\n- - - <comment>merged message content</comment> - - -\n"
        lastMessage.content = lastMessage.content + "\n" + message.content;
      } else {
        newMessages.push(message);
      }
      lastRole = message.role;
      mergedMessageCount += 1;
    });

    bodyJson.messages = newMessages;
    aRequest.setBodyJson(bodyJson);

    if (mergedMessageCount) {
      //console.log("XaiService.prepareToSendRequest() merged " + mergedMessageCount + " messages");
    }
  */
        return this;
    }

}.initThisClass());
