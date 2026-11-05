/**
 * @module library.services.OpenAI
 */

/**
 * @class SvOpenAiService
 * @extends SvAiService
 * @classdesc SvOpenAiService is a SvSummaryNode that holds the API key and subnodes for the various OpenAI services.
 */
"use strict";

(class SvOpenAiService extends SvAiService {

    /**
   * @static
   * @description Initializes the class and sets it as a singleton.
   * @category Initialization
   */
    static initClass () {
        this.setIsSingleton(true);
    }

    serviceInfo () {
        return {
            "chatEndpoint": "https://api.openai.com/v1/chat/completions"
        };
    }

    /**
   * @description Returns an array of model configurations.
   * @returns {Array<Object>} An array of model objects with name, note, and contextWindow properties.
   * @category Model Configuration
   */
    modelsJson () {
        return [
            {
                "name": "gpt-6-astra",
                "title": "GPT-6 Astra",
                // Keep the app's compaction budget at 200k (API context: 1.05M).
                "inputTokenLimit": 200000,
                "outputTokenLimit": 128000,
                "supportsTemperature": false,
                "supportsTopP": false
            },

            {
                "name": "gpt-5.2",
                "title": "ChatGPT 5.2",
                "inputTokenLimit": 400000,
                "outputTokenLimit": 128000
            },
            {
                "name": "gpt-5.1-chat-latest",
                "title": "ChatGPT 5.1",
                "inputTokenLimit": 272000,
                "outputTokenLimit": 128000
                //"reasoning_effort": "low" | "medium" | "high"
            },
            {
                "name": "gpt-5-mini",
                "title": "ChatGPT 5 Mini",
                "inputTokenLimit": 400000,
                "outputTokenLimit": 128000
            },
            {
                "name": "gpt-5-nano",
                "title": "ChatGPT 5 Nano",
                "inputTokenLimit": 272000,
                "outputTokenLimit": 128000
            }
        ];
    }

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {SvOpenAiImagePrompts} imagesPrompts
     * @category Image Generation
     */
        {
            const slot = this.newSlot("imagesPrompts", null);
            slot.setFinalInitProto(SvOpenAiImagePrompts);
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
        }

        /**
     * @member {SvOpenAiTtsSessions} ttsSessions
     * @category Text-to-Speech
     */
        {
            const slot = this.newSlot("ttsSessions", null);
            slot.setFinalInitProto(SvOpenAiTtsSessions);
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
        }

        /**
     * @member {SvOpenAiStyleTransfers} styleTransfers
     * @category Style Transfer
     */
        {
            const slot = this.newSlot("styleTransfers", null);
            slot.setFinalInitProto(SvOpenAiStyleTransfers);
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
        }

    /*
    {
      const slot = this.newSlot("imageEvaluators", null);
      slot.setFinalInitProto(OpenAiImageEvaluators);
      slot.setIsSubnode(true);
      slot.setShouldStoreSlot(true);
    }
    */
    }

    /**
   * @description Performs final initialization steps for the instance.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setTitle(this.svType().before("Service"));

        // model and other info is set via SvOpenAiService.json file
        // see: https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4

        // this.setupModelsFromFetch();
    }

    /*
    async setupModelsFromFetch () {
        try {
            const modelsJson = await this.fetchAllModelsDetails();
            console.log(modelsJson);
        } catch (error) {
            console.error("Error fetching models:", error);
        }
    }
    */

    /**
   * @description Validates the API key.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the key is valid, false otherwise.
   * @category Authentication
   */
    validateKey (s) {
        return s.length === 51 && s.startsWith("sk-");
    }


}.initThisClass());
