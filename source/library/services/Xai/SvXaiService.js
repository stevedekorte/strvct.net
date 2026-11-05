"use strict";

/**
 * @module library.services.Xai
 */

/**
 * @class SvXaiService
 * @extends SvAiService
 * @classdesc SvXaiService
 *
 * NOTES: Grok doesn't require alternate user and assistant roles, so we don't need to merge messages like Xai does.
 * - No docs on whether system messages must be placed at the beginning of the messages array.
*/

(class SvXaiService extends SvAiService {

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
        // Text/chat models from https://docs.x.ai/developers/models (2026-08-12).
        // grok-4-latest / grok-4-0709 / grok-3 / grok-4-fast* retired 2026-05-15.
        // Imagine and Voice are not chat models and stay off this list.
        return [
            {
                "name": "grok-4.6",
                "title": "Grok 4.6",
                "subtitle": "Flagship — chat, code, and agents",
                "inputTokenLimit": 500000,
                "outputTokenLimit": 256000
            },
            {
                "name": "grok-4.5",
                "title": "Grok 4.5",
                "subtitle": "Previous flagship",
                "inputTokenLimit": 500000,
                "outputTokenLimit": 256000
            },
            {
                "name": "grok-4.3",
                "title": "Grok 4.3",
                "subtitle": "1M context, configurable reasoning",
                "inputTokenLimit": 1000000,
                "outputTokenLimit": 256000
            },
            {
                "name": "grok-4.20-0309-reasoning",
                "title": "Grok 4.20 Reasoning",
                "inputTokenLimit": 1000000,
                "outputTokenLimit": 256000
            },
            {
                "name": "grok-4.20-0309-non-reasoning",
                "title": "Grok 4.20",
                "inputTokenLimit": 1000000,
                "outputTokenLimit": 256000
            },
            {
                "name": "grok-4.20-multi-agent-0309",
                "title": "Grok 4.20 Multi-Agent",
                "inputTokenLimit": 1000000,
                "outputTokenLimit": 256000
            }
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
   * @returns {SvXaiService} The service instance.
   * @category Request Handling
   */
    prepareToSendRequest (/*aRequest*/) {
        return this;
    }

}.initThisClass());
