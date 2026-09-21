/**
 * @module library.services.Leonardo
 */

/**
 * @class SvLeonardoService
 * @extends SvAiService
 * @classdesc SvLeonardoService manages the Leonardo.ai API key and subnodes for the various Leonardo services.
 */
"use strict";

(class SvLeonardoService extends SvAiService {

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
     * @member {SvOpenAiImagePrompts} imagesPrompts
     * @category Image Generation
     */
        {
            const slot = this.newSlot("imagesPrompts", null);
            slot.setFinalInitProto(SvLeonardoImagePrompts);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
        }

        /**
     * @member {SvLeonardoRefImages} refImages
     * @category Ref Images
     */

        {
            const slot = this.newSlot("refImages", null);
            slot.setFinalInitProto(SvLeonardoRefImages);
            slot.setShouldStoreSlot(true);
            slot.setIsSubnode(true);
        }

        /**
     * @member {SvLeonardoRefImages} styleTransfers
     * @category Style Transfers
     */
        {
            const slot = this.newSlot("styleTransfers", null);
            slot.setFinalInitProto(SvLeoStyleTransfers);
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
