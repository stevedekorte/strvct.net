/**
 * @module library.services.DeepSeek
 */

/**
 * @class SvDeepSeekService
 * @extends SvAiService
 * @classdesc SvDeepSeekService is a SvSummaryNode that holds the API key and subnodes for the various OpenAI services.
 */
"use strict";

(class SvDeepSeekService extends SvAiService {

    /**
   * @static
   * @description Initializes the class and sets it as a singleton.
   * @category Initialization
   */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
   * @description Returns an array of model configurations.
   * @returns {Array<Object>} An array of model objects with name, note, and contextWindow properties.
   * @category Model Configuration
   */
    modelsJson () {
        return [
            {
                "name": "deepseek-coder",
                "title": "DeepSeek Coder",
                "inputTokenLimit": 65536,
                "outputTokenLimit": 8192,
                "maxChainOfThoughtTokens": 32000
            }
            /*
      {
          "name": "deepseek-chat",
          "title": "DeepSeek Chat",
          "inputTokenLimit": 65536,
          "outputTokenLimit": 8192,
          "maxChainOfThoughtTokens": 8000
      },

      {
          "name": "deepseek-reasoner",
          "title": "DeepSeek Reasoner",
          "inputTokenLimit": 64000,
          "outputTokenLimit": 32000,
          "maxChainOfThoughtTokens": 32000
      }
      */
        ];
    }

    /**
   * @description Initializes the prototype slots for the class.
   * @category Initialization
   */
    initPrototypeSlots () {

    }

    /**
   * @description Initializes the instance.
   * @category Initialization
   */
    init () {
        super.init();
    }

    /**
   * @description Returns the service information.
   * @returns {Object} The service information.
   * @category Service Information
   */
    serviceInfo () {
        return {
            "source": "https://api-docs.deepseek.com",
            "chatEndpoint": "https://api.deepseek.com/chat/completions"
        };
    }

    /**
   * @description Performs final initialization steps for the instance.
   * @category Initialization
   */
    finalInit () {
        super.finalInit();
        this.setTitle(this.svType().before("Service"));
        this.assertHasModels();


    // model and other info is set via SvDeepSeekService.json file
    // see: https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
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


    setModelsJson (json) {
        super.setModelsJson(json);
        //console.log(this.svType() + ".setModelsJson() has " + this.models().subnodes().length + " models now.");
        this.assertHasModels();

        return this;
    }

    setModels (aAiChatModels) {

        return super.setModels(aAiChatModels);
    }

    // NOTE (Plans/Cache-Safe Standing View): prepareToSendRequest above is
    // commented out — DeepSeek inherits the base no-op, does NOT merge, and
    // tolerates consecutive same-role messages, so it also inherits
    // requiresAlternatingRoles() === false (the OpenAI/xAI treatment). If the
    // merge loop is ever revived, add the ephemeral-dict guard from
    // SvAnthropicService AND override requiresAlternatingRoles to true.

    assertHasModels ()  {
        assert(this.models().subnodes().length > 0, "SvDeepSeekService must have at least one model");
    }

    /*
 title () {
  this.assertHasModels();
  return super.title() + " (" + this.models().subnodes().length + " models)";
 }
*/

}.initThisClass());
