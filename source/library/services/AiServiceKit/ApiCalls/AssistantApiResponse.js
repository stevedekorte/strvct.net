"use strict";

(class AssistantApiResponse extends HwJsonDictionaryNode {

  static jsonSchemaDescription () {
    return "JSON schema for client response to an '" + this.callName() + "' Assistant API call.";
  }

  static callName () {
    return this.type().replace("Response", "Call");
  }

  /**
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.newSlot("apiType", null);
      slot.setDescription("Name of the API response.");
      slot.setSlotType("String");
      slot.setValidValues(["Response"]);
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
    }

    {
      const slot = this.newSlot("callId", null);
      slot.setDescription("A unique identifier from the call.");
      slot.setSlotType("String");
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
    }

    {
      const slot = this.newSlot("status", null);
      slot.setDescription("A string describing the status of the call.");
      slot.setSlotType("String");
      slot.setValidValues(["success", "failure"]);
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
    }

    {
      const slot = this.newSlot("payload", null);
      slot.setDescription("A Json object containing the parameters for the method, or the response to the call.");
      slot.setSlotType("Dictionary"); // subclasses should override this a needed
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
    }

    {
      const slot = this.newSlot("error", null);
      slot.setDescription("An error JSON dictionary if the call failed.");
      slot.setSlotType("Dictionary");
      slot.setShouldJsonArchive(true);
      slot.setIsInJsonSchema(true);
      slot.setIsRequired(false);
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

}.initThisClass());