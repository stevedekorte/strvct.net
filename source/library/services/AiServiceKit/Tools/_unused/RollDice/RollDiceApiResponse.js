"use strict";


(class RollDiceApiResponse extends AssistantApiResponse {

  static assistantApiDetails () {
    return "The results of rolling a specificed type and number of dice.";
  }

  /**
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.overrideSlot("payload", null);
      slot.setSlotType("String");
    }

  }

}.initThisClass());
