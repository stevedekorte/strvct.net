"use strict";

/*
* @module library.services.AiServiceKit.ApiCalls
* @class AssistantApiCall
* @extends BMJsonDictionaryNode
* @classdesc
* This class represents an API call to the Assistant.
*
* It has several uses:
* - Describing the API call schema in the system prompt:
* -- It can be used to compose the part of the system prompt which describes the API call to the Assistant, including describing the JSON schema of the API call. 
* -- Subclasses can likewise describe their specific API call schema. 
* -- The Conversation class has a apiCallClasses() method which returns an array of classes which are used to compose the system prompt.
* -- When the conversation starts, it uses this to help compose the system prompt.
*
* - Handling the API call response:
* -- It can be used by the conversation to scan the Assistant's response for API calls.
* -- If an API call is found, this class's instance can handling calling the API on the client side, handling errors, and returning the response to the conversation.
*/

(class AssistantApiCall extends HwJsonDictionaryNode {

  static jsonSchemaDescription () {
    return "Format for Assistant API call to make an '" + this.type() + "' API call.";
  }
  /**
   * Initializes the prototype slots.
   * @category Initialization
   */
  initPrototypeSlots () {

    {
      const slot = this.overrideSlot("jsonId", null);
      slot.setIsInJsonSchema(false);
      slot.setIsSubnodeField(false);
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("apiType", "AssistantApiCall");
      slot.setDescription("Name of the API call.");
      slot.setSlotType("String");
      slot.setValidValues(["AssistantApiCall"]);
      slot.setShouldJsonArchive(true);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(true);
    }

    {
      const slot = this.newSlot("callId", null);
      slot.setDescription("A unique identifier for the call. The response will be tagged with this id.");
      slot.setSlotType("String");
      slot.setAllowsNullValue(true);
      slot.setShouldJsonArchive(true);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(true);
    }

    {
      const slot = this.newSlot("payload", null);
      slot.setDescription("A Json object containing the parameters for the method, or the response to the call.");
      slot.setSlotType("Dictionary"); // subclasses should override this a needed
      slot.setShouldJsonArchive(true);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(true);
    }

    {
      const slot = this.newSlot("apiSpecPromptString", null);
      slot.setDescription("A string which describes the API call to the Assistant.");
      slot.setSlotType("String");
      slot.setShouldJsonArchive(false);
      slot.setIsSubnodeField(true);
      slot.setCanEditInspection(false);
      slot.setIsInJsonSchema(false);
      slot.setValueWhiteSpace("pre");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setNodeCanReorderSubnodes(false);
    this.setCanDelete(false);
    this.setNodeCanAddSubnode(false);
    /*
    this.setSummaryFormat("value");
    this.setHasNewlineAfterSummary(true);
    */
  }

  title () {
    return this.type();
  }

  static responseClassName () {
    // The response class has the same name as the call class, but with "Response" at the end instead of "Call".
    return this.type().replace("Call", "Response");
  }

  static responseClass () {
    return getGlobalThis()[this.responseClassName()];
  }

  static expectsResponse () {
    return this.responseClass() !== undefined;
  }

  setupPayloadSlot () {
    throw new Error("setupPayloadSlot - subclasses should override this");
  }

  apiSpecPromptString () {
    if (this._apiSpecPromptString === null) {
      this.setupPayloadSlot();
      this._apiSpecPromptString = this.thisClass().apiSpecPrompt();
    }
    return this._apiSpecPromptString;
  }

  static apiSpecPrompt () {
    let s = this.type() + " API Call Schema:\n\n" + this.taggedJsonSchemaString();
    s += "\n\n";
    if (this.expectsResponse()) {
      s += "Assistant should expect a response with the following schema: \n\n";
      s += this.responseClass().taggedJsonSchemaString();
    } else {
      s += "No response is expected from this call.";
    }

    return s;
  }

  handleCall () {
    throw new Error("handleCall - subclasses should override this");
  }

}.initThisClass());