/**
 * @module library.services.ImaginePro
 */

/**
 * @class ImagineProService
 * @extends AiService
 * @classdesc ImagineProService is a service for ImaginePro's Midjourney API.
 *
 * IMPORTANT: This service ONLY supports Midjourney V7 or later versions.
 * V7 uses --oref (omnireference) and --ow (omnireference weight) parameters.
 * We do NOT support V6 or earlier versions (which used --cref/--cw).
 *
 */
"use strict";

(class ImagineProService extends AiService {

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
            "taskEndpoint": "https://api.imaginepro.ai/api/v1/nova/imagine"
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
                "name": "midjourney",
                "title": "Midjourney",
                "inputTokenLimit": 4000,
                "outputTokenLimit": 4000,
                "supportsImageGeneration": true
            }
        ];
    }

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {

        /**
     * @member {ImagineProImagePrompts} imagesPrompts
     * @category Image Generation
     */
        {
            const slot = this.newSlot("imagesPrompts", null);
            slot.setFinalInitProto(ImagineProImagePrompts);
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
        }


        /**
     * @member {ImagineProImageEvalPrompts} imageEvalPrompts
     * @category Image Eval Prompts
     */

        {
            const slot = this.newSlot("imageEvalPrompts", null);
            slot.setFinalInitProto(ImagineProImageEvalPrompts);
            slot.setIsSubnode(true);
            slot.setShouldStoreSlot(true);
        }

    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }


    /**
   * @description Performs final initialization steps for the instance.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setTitle(this.svType().before("Service"));
    }

    /**
   * @description Validates the API key.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the key is valid, false otherwise.
   * @category Authentication
   */
    validateKey (s) {
        // ImaginePro API keys are typically longer alphanumeric strings
        // Adjust validation based on actual ImaginePro key format
        return s.length > 20 && /^[a-zA-Z0-9_-]+$/.test(s);
    }

}.initThisClass());
