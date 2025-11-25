/**
 * @module library.services.OpenAI
 */

/**
 * @class OpenAiService
 * @extends AiService
 * @classdesc OpenAiService is a SvSummaryNode that holds the API key and subnodes for the various OpenAI services.
 */
"use strict";

(class OpenAiService extends AiService {

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
                "name": "gpt-5.1-chat-latest",
                "title": "ChatGPT 5.1",
                "inputTokenLimit": 272000,
                "outputTokenLimit": 128000
                //"reasoning_effort": "low" | "medium" | "high"
            },
            {
                "name": "gpt-4.1",
                "title": "ChatGPT 4.1",
                "inputTokenLimit": 1047576,
                "outputTokenLimit": 32768
            }
        ];
    }

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {OpenAiImagePrompts} imagesPrompts
     * @category Image Generation
     */
        {
            const slot = this.newSlot("imagesPrompts", null);
            slot.setFinalInitProto(OpenAiImagePrompts);
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
        }

        /**
     * @member {OpenAiTtsSessions} ttsSessions
     * @category Text-to-Speech
     */
        {
            const slot = this.newSlot("ttsSessions", null);
            slot.setFinalInitProto(OpenAiTtsSessions);
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
        }

        /**
     * @member {OpenAiStyleTransfers} styleTransfers
     * @category Style Transfer
     */
        {
            const slot = this.newSlot("styleTransfers", null);
            slot.setFinalInitProto(OpenAiStyleTransfers);
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

        // model and other info is set via OpenAiService.json file
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


    /*
    fetchModelsUrl () {
        return "https://api.openai.com/v1/models";
    }

    fetchModelDetailsUrl (modelId) {
        return `https://api.openai.com/v1/models/${modelId}`;
    }

    async fetchAllModelsDetails () {
        const apiKey = this.apiKeyOrUserAuthToken();
        const headers = {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        };

        // Step 1: Fetch the list of model IDs
        const listResp = await fetch(this.fetchModelsUrl(), { headers: headers });

        if (!listResp.ok) {
            throw new Error(`Model list fetch failed: ${listResp.statusText}`);
        }
        const listData = await listResp.json();

        // Step 2: Fetch extended info on each model
        const detailedModels = {};
        for (const model of listData.data) {
            const id = model.id;
            try {
                const detailResp = await fetch(this.fetchModelDetailsUrl(id), { headers: headers });
                if (!detailResp.ok) {
                    throw new Error(`Fetch failed for ${id}: ${detailResp.statusText}`);
                }
                const detailData = await detailResp.json();
                detailedModels[id] = detailData;
            } catch (err) {
                console.warn(`Skipping model ${id} due to error:`, err.message);
            }
        }

        return detailedModels;
    }
    */


}.initThisClass());
