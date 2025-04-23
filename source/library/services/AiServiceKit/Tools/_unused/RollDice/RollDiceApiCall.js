"use strict";


(class RollDiceApiCall extends AssistantApiCall {

  static jsonSchemaDescription () {
    return "Format for Assistant API call to roll a specificed type and number of dice and return the results.";
  }

  /**
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {
    {
      const slot = this.overrideSlot("apiType", "RollDiceApiCall");
      slot.setSlotType("String");
      slot.setValidValues(["RollDiceApiCall"]);
    }

    {
      const slot = this.overrideSlot("payload", null);
      slot.setSlotType("Dictionary");
    }

  }

  setupPayloadSlot () {
  }


}.initThisClass());
