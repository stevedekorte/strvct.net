"use strict";

/**
 * @module library.services.Anthropic
 */

/**
 * @class SvAnthropicService
 * @extends SvAiService
 * @classdesc A SvSummaryNode that holds the API key and subnodes for the various Anthropic services.
 */

(class SvAnthropicService extends SvAiService {

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
                "name": "claude-sonnet-5",
                "title": "Claude Sonnet 5",
                "subtitle": "",
                "inputTokenLimit": 1000000,
                "notes": "Adaptive-thinking model family: temperature/top_p/top_k are not supported (400 if set). Effort defaults to high.",
                "outputTokenLimit": 128000,
                "supportsTemperature": false,
                "supportsTopP": false
            },
            {
                "name": "claude-fable-5",
                "title": "Claude Fable 5",
                "subtitle": "",
                "inputTokenLimit": 1000000,
                "notes": "Most capable Anthropic model ($10/$50 per MTok). Thinking is always on (never send a thinking param). temperature/top_p/top_k not supported. Safety classifiers can return stop_reason 'refusal'. Requires 30-day data retention at the org level.",
                "outputTokenLimit": 128000,
                "supportsTemperature": false,
                "supportsTopP": false
            },
            {
                "name": "claude-opus-4-8",
                "title": "Claude Opus 4.8",
                "subtitle": "",
                "inputTokenLimit": 1000000,
                "notes": "Adaptive-thinking model family: temperature/top_p/top_k are not supported (400 if set).",
                "outputTokenLimit": 128000,
                "supportsTemperature": false,
                "supportsTopP": false
            },
            {
                "name": "claude-opus-4-7",
                "title": "Claude Opus 4.7",
                "subtitle": "",
                "inputTokenLimit": 1000000, // 1M context at standard pricing
                "notes": "Uses a new tokenizer that may use up to 35% more tokens for the same text. Temperature, top_p, top_k are not supported.",
                "outputTokenLimit": 128000,
                "supportsTemperature": false, // 400 error if temperature is set
                "supportsTopP": false // 400 error if top_p is set
            },
            {
                "name": "claude-sonnet-4-6",
                "title": "Claude Sonnet 4.6",
                "subtitle": "",
                "inputTokenLimit": 200000,
                "notes": "",
                "outputTokenLimit": 64000,
                "supportsTemperature": true,
                "supportsTopP": false // Anthropic doesn't allow both temperature and top_p
            },
            {
                "name": "claude-opus-4-5-20251101",
                "title": "Claude 4.5 Opus",
                "subtitle": "",
                "inputTokenLimit": 200000,
                "notes": "",
                "outputTokenLimit": 64000,
                "supportsTemperature": true,
                "supportsTopP": false // Anthropic doesn't allow both temperature and top_p
            },
            {
                "name": "claude-haiku-4-5",
                "title": "Claude Haiku 4.5",
                "subtitle": "",
                "inputTokenLimit": 200000,
                "notes": "",
                "outputTokenLimit": 64000,
                "supportsTemperature": true,
                "supportsTopP": false // Anthropic doesn't allow both temperature and top_p
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
   * @returns {SvAnthropicService} The service instance.
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
            //console.log("SvAnthropicService.prepareToSendRequest() merged " + mergedMessageCount + " messages");
        }

        //const tools = this.toolCallSchemasForRequest(aRequest);
        // ok, now let's add the tools property where will with specify the tool call JSON schemas

        /*
        if (tools.length > 0) {
            bodyJson.tools = tools;
        }
        */

        this.applyPromptCaching(bodyJson);

        return this;
    }

    /**
   * @description Adds Anthropic prompt-cache breakpoints (cache_control) to
   * the outbound body. Purely structural — derives boundaries from the
   * generic {system, messages} shape, no app/game knowledge:
   *
   *   1. End of the system prompt (large and fixed for the whole session,
   *      so it caches once and reads at ~0.1x thereafter).
   *   2. Last content block of the FINAL message — advanced every request,
   *      so each turn writes only the new tail beyond the longest matched
   *      prefix and reads everything before it from cache.
   *   3. Last block of a message ~6 back — lookback insurance: a breakpoint
   *      only searches 20 content blocks backwards for a prior cache entry,
   *      and long tool-heavy turns can exceed that.
   *
   * 3 markers of Anthropic's 4-per-request budget. Providers with automatic
   * prefix caching (Gemini, OpenAI) need none of this — which is why it
   * lives here and not in the shared AiServiceKit layer.
   * @param {Object} bodyJson
   * @category Request Handling
   */
    applyPromptCaching (bodyJson) {
        const marker = { type: "ephemeral" };

        if (Type.isString(bodyJson.system) && bodyJson.system.length > 0) {
            bodyJson.system = [{ type: "text", text: bodyJson.system, "cache_control": marker }];
        }

        const messages = bodyJson.messages;
        if (!Type.isArray(messages) || messages.length === 0) {
            return this;
        }

        const markMessage = (m) => {
            if (Type.isString(m.content)) {
                if (m.content.length === 0) {
                    return; // empty blocks are rejected by the API
                }
                m.content = [{ type: "text", text: m.content, "cache_control": marker }];
            } else if (Type.isArray(m.content) && m.content.length > 0) {
                m.content[m.content.length - 1]["cache_control"] = marker;
            }
        };

        markMessage(messages[messages.length - 1]);
        if (messages.length > 6) {
            markMessage(messages[messages.length - 6]);
        }
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
