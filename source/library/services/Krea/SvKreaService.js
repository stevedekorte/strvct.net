/**
 * @module library.services.Krea
 */

/**
 * @class SvKreaService
 * @extends SvAiService
 * @classdesc SvKreaService is a service for Krea's own image generation API
 * (api.krea.ai).
 *
 * Krea 2 accepts a CUSTOM TRAINED STYLE (LoRA, referenced by id) and REFERENCE
 * IMAGES in the same request. That combination is what lets a generated scene
 * carry both a trained art look and per-subject continuity, and it is why we
 * talk to Krea directly rather than through a gateway that splits the two into
 * separate endpoints.
 *
 * Trained styles are PRIVATE to the API key that created them, so a style id is
 * inert without our server-side key — which is why the id lives in a normal
 * (inspectable, tunable) slot on the prompt rather than behind the proxy.
 *
 * All requests go through the proxy for accounting, key management, and CORS.
 */
"use strict";

(class SvKreaService extends SvAiService {

    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);

        // Base URL for the Krea API, overridable globally at the app level (the
        // same escape hatch SvImagineProImagePrompt.endpointBase provides).
        this.newClassSlot("endpointBase", "https://api.krea.ai/");
    }

    serviceInfo () {
        return {
            "taskEndpoint": this.thisClass().endpointBase() + "generate/image/krea/"
        };
    }

    /**
     * @description Returns an array of model configurations. These mirror the
     * three Krea 2 tiers registered in the backend KreaService pricing table —
     * a model missing there is rejected by the proxy, so the two lists must
     * stay in step.
     * @returns {Array<Object>} An array of model objects.
     * @category Model Configuration
     */
    modelsJson () {
        return [
            {
                "name": "krea-2/medium-turbo",
                "title": "Krea 2 Medium Turbo",
                "inputTokenLimit": 4000,
                "outputTokenLimit": 4000,
                "supportsImageGeneration": true
            },
            {
                "name": "krea-2/medium",
                "title": "Krea 2 Medium",
                "inputTokenLimit": 4000,
                "outputTokenLimit": 4000,
                "supportsImageGeneration": true
            },
            {
                "name": "krea-2/large",
                "title": "Krea 2 Large",
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
         * @member {SvKreaImagePrompts} imagesPrompts
         * @category Image Generation
         */
        {
            const slot = this.newSlot("imagesPrompts", null);
            slot.setFinalInitProto(SvKreaImagePrompts);
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
        return s.length > 20;
    }

}.initThisClass());
