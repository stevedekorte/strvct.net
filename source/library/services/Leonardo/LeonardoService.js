/**
 * @module library.services.Leonardo
 */

/**
 * @class LeonardoService
 * @extends AiService
 * @classdesc LeonardoService manages the Leonardo.ai API key and subnodes for the various Leonardo services.
 */
"use strict";

(class LeonardoService extends AiService {

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
        };
    }

    /**
   * @description Returns an array of model configurations.
   * @returns {Array<Object>} An array of model objects with name, note, and contextWindow properties.
   * @category Model Configuration
   */
    modelsJson () {
        return [
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
            slot.setFinalInitProto(LeonardoImagePrompts);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
        }

        /**
     * @member {LeonardoRefImages} refImages
     * @category Ref Images
     */

        {
            const slot = this.newSlot("refImages", null);
            slot.setFinalInitProto(LeonardoRefImages);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
        }

        /**
     * @member {LeonardoRefImages} styleTransfers
     * @category Style Transfers
     */
        {
            const slot = this.newSlot("styleTransfers", null);
            slot.setFinalInitProto(LeoStyleTransfers);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
        }

        /*
    {
      const slot = this.overrideSlot("conversations", null);
      slot.setIsVisible(true);
    }

    {
      const slot = this.overrideSlot("models", null);
      slot.setIsVisible(true);
    }
    */

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
        this.setTitle("Leonardo.ai");
        this.initPrototype();

        this.conversations().setIsVisible(false);
        this.models().setIsVisible(false);
    }

    /**
   * @description Validates the API key.
   * @param {string} s - The API key to validate.
   * @returns {boolean} True if the key is valid, false otherwise.
   * @category Authentication
   */
    validateKey (/*s*/) {
        return true;
    }

}.initThisClass());
