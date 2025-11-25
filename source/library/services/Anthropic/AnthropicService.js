"use strict";

/**
 * @module library.services.Anthropic
 */

/**
 * @class AnthropicService
 * @extends AiService
 * @classdesc A SvSummaryNode that holds the API key and subnodes for the various Anthropic services.
 *
 * @example

*/

(class AnthropicService extends AiService {

    /**
   * @static
   * @description Initializes the class as a singleton.
   * @category Initialization
   */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
   * @description Returns an array of model configurations.
   * @returns {Array<Object>} An array of model configuration objects.
   * @category Configuration
   */
    modelsJson () {
        return [
            {
                "name": "claude-opus-4-5-20251101",
                "title": "Claude 4.5 Opus",
                "subtitle": "",
                "inputTokenLimit": 1000000, // would be 200k input tokens without beta request for 1M context
                "notes": "",
                "beta": "context-1m-2025-08-07,output-128k-2025-02-19", // 1M context only supported for Tier 4 members
                "outputTokenLimit": 64000, // 128k output tokens
                "supportsTemperature": true,
                "supportsTopP": false  // Anthropic doesn't allow both temperature and top_p
            }
        ];
    }


    serviceInfo () {
        return {
            "chatEndpoint": "https://api.anthropic.com/v1/messages"
        };
    }

    /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setTitle(this.svType().before("Service"));
        //this.setSystemRoleName("user"); // only replaced in outbound request json // we now move this message into the system property
    }

    /**
   * @description Validates the API key format.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the API key is valid, false otherwise.
   * @category Authentication
   */
    validateKey (s) {
        return s.startsWith("sk-");
    }

    /**
   * @description Prepares the request before sending it to the API.
   * @param {Object} aRequest - The request object to prepare.
   * @returns {AnthropicService} The service instance.
   * @category Request Handling
   */
    prepareToSendRequest (aRequest) {

        const bodyJson = aRequest.bodyJson();
        let messages = bodyJson.messages;

        // remove initial system message and place it in the request json

        if (messages.length > 0) {
            const firstMessage = messages.first();
            if (firstMessage.role === this.systemRoleName()) {
                bodyJson.system = firstMessage.content;
                firstMessage.content = "Please begin the conversation now.";
                //messages.shift();
            }
        }

        bodyJson.reorderKeyFirst("system");

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

        this.reorderKeyFirst("system");

        bodyJson.messages = newMessages;
        aRequest.setBodyJson(bodyJson);

        if (mergedMessageCount) {
            //console.log("AnthropicService.prepareToSendRequest() merged " + mergedMessageCount + " messages");
        }

        //const tools = this.toolCallSchemasForRequest(aRequest);
        // ok, now let's add the tools property where will with specify the tool call JSON schemas

        /*
        if (tools.length > 0) {
            bodyJson.tools = tools;
        }
        */

        return this;
    }

    /*
    fetchModelsUrl () {
        return "https://api.anthropic.com/v1/models";
    }
    */

    toolCallSchemasForRequest (aRequest) {
        const assistantToolKit = aRequest.conversation().assistantToolKit();
        const toolDefs = assistantToolKit.toolDefinitions();

        const schemas = toolDefs.toolDefinitions().map((toolDef) => {
            return toolDef.asAnthropicToolCallSchema();
        });

        return schemas;
    }


}.initThisClass());
