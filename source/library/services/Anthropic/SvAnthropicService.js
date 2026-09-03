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
                "name": "claude-fable-5-1",
                "title": "Claude Fable 5.1",
                "subtitle": "",
                // Deliberately BELOW the model's 1M window: input beyond 200k
                // bills at Anthropic's long-context premium, and this limit is
                // also what the conversation's compaction pressure keys off —
                // 200k keeps sessions out of the premium tier entirely.
                "inputTokenLimit": 200000,
                "notes": "Most capable Anthropic model ($10/$50 per MTok; cache read $1, write $12.50). Thinking is always on — NEVER send a thinking param (400 on any explicit config except adaptive). temperature/top_p/top_k not supported. Safety classifiers can return stop_reason 'refusal'. Requires 30-day data retention at the org level. Supports all five effort levels via output_config.effort.",
                "outputTokenLimit": 128000,
                "effort": "medium", // game choice: latency/cost balance (default would be high)
                "supportsTemperature": false,
                "supportsTopP": false
            },
            {
                "name": "claude-sonnet-5",
                "title": "Claude Sonnet 5",
                "subtitle": "",
                // The model's window is 1M and there is no long-context
                // premium (4.6-and-later models bill the full window at
                // standard rates). This lower cap is a deliberate game
                // choice: it is what the conversation's compaction pressure
                // keys off, and it bounds per-turn input cost. Raise it if
                // long sessions start compacting away context you want kept.
                "inputTokenLimit": 200000,
                "notes": "Game default model ($2/$10 per MTok; cache read $0.20, write $2.50). Adaptive-thinking model family: temperature/top_p/top_k are not supported (400 if set). Effort accepts low/medium/high/xhigh/max and defaults to high.",
                "outputTokenLimit": 128000,
                "effort": "medium", // game choice: latency/cost balance (default would be high)
                "supportsTemperature": false,
                "supportsTopP": false
            },
            {
                "name": "claude-opus-5",
                "title": "Claude Opus 5",
                "subtitle": "",
                "inputTokenLimit": 1000000,
                "notes": "Used for simulated players / AI-run party members, kept distinct from the GM model to reduce self-collusion ($5/$25 per MTok; cache read $0.50, write $6.25). Adaptive thinking is on by default; disabling it requires effort high or below. Effort accepts low/medium/high/xhigh/max and defaults to high. temperature/top_p/top_k are not supported. Priority Tier is not supported.",
                "outputTokenLimit": 128000,
                "effort": "medium", // a simulated player does not need the default high
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
            // Ephemeral dicts (standing-view trailer, filing reminders — see
            // Plans/Cache-Safe Standing View) may merge with each other but
            // NEVER with a stored neighbor: folding a per-request trailer
            // into the last stored user changes that message's bytes between
            // requests, busting the prompt-cache prefix (and the helper adds
            // an assistant spacer so this adjacency shouldn't arise anyway).
            const lastMessage = newMessages.length ? newMessages.last() : null;
            const sameEphemerality = lastMessage
                && (message.isEphemeral === true) === (lastMessage.isEphemeral === true);
            if (message.role === lastRole && sameEphemerality) {
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

        // Markers go on STORED messages only (Plans/Cache-Safe Standing View):
        // an ephemeral trailer's bytes differ every request, so a cache_control
        // there is a cache WRITE (1.25×) that can never be read back. The last
        // stored message is exactly the prefix the next request re-sends.
        const stored = messages.filter((m) => m.isEphemeral !== true);
        if (stored.length === 0) {
            return this;
        }
        markMessage(stored[stored.length - 1]);
        if (stored.length > 6) {
            markMessage(stored[stored.length - 6]);
        }
        return this;
    }

    /**
   * @description Anthropic's Messages API requires strict user/assistant
   * alternation (the merge loop above exists for exactly this reason), so an
   * ephemeral user trailer after a stored user message needs a spacer.
   * @returns {Boolean}
   * @category Request Handling
   */
    requiresAlternatingRoles () {
        return true;
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
