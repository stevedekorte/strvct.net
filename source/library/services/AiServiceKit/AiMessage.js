/**
 * @module library.services.AiServiceKit
 */

/**
 * @class AiMessage
 * @extends ConversationMessage
 * @classdesc Represents an AI message in a conversation. This class handles different roles
 * (system, user, assistant) and manages the content and behavior of the message.
 */
"use strict";

(class AiMessage extends ConversationMessage {

  /**
   * @description Returns an array of valid roles for the AI message.
   * @returns {string[]} Array of valid roles.
   * @category Configuration
   */
  validRoles () {
    /* 
      system: high-level instructions to guide the model's behavior throughout the conversation. 
      user: role represents the user or the person initiating the conversation. You provide user messages or prompts in this role to instruct the model.
      assistant: role represents the AI model or the assistant. 
      The model generates responses in this role based on the user's prompts and the conversation history.
    */
   
    return [
      "system", 
      "user",
      "assistant" 
    ];
  }
  
  /**
   * @description Initializes the prototype slots for the AiMessage class.
   * @category Initialization
   */
  initPrototypeSlots () {

    /**
     * @member {string} role - The role of the message (user, system, or assistant).
     * @category Message Properties
     */
    {
      const slot = this.newSlot("role", "user"); 
      slot.setShouldJsonArchive(true)
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(this.validRoles())
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
    }

    /**
     * @member {boolean} isVisibleToAi - Determines if the message is visible to the AI.
     * @category Message Properties
     */
    {
      const slot = this.newSlot("isVisibleToAi", true);
      slot.setSlotType("Boolean");
      slot.setShouldStoreSlot(true);
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
    }

    /**
     * @member {Action} requestResponseAction - Action for requesting a response.
     * @category Actions
     */
    {
      const slot = this.newSlot("requestResponseAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Request Response");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setCanInspect(true)
      slot.setActionMethodName("requestResponse");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setCanDelete(true);
  }

  /**
   * @description Initializes the AiMessage instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setContent("");
  }

  /**
   * @description Checks if the message is a response.
   * @returns {boolean} Always returns false for AiMessage.
   * @category Message Properties
   */
  isResponse () {
    return false;
  }

  /**
   * @description Determines if the message is visible.
   * @returns {boolean} True if the role is not "system", false otherwise.
   * @category Message Properties
   */
  isVisible () {
    return this.role() !== "system";
  }

  /**
   * @description Checks if the value is editable.
   * @returns {boolean} True if the role is "user", false otherwise.
   * @category Message Properties
   */
  valueIsEditable () {
    return this.role() === "user";
  }

  /**
   * @description Returns the AI speaker name.
   * @returns {string} The name of the AI speaker.
   * @category Message Properties
   */
  aiSpeakerName () {
    return "LLM";
  }

  /**
   * @description Gets the content of the message.
   * @returns {string} The content of the message.
   * @category Message Properties
   */
  content () {
    return this.value()
  }

  /**
   * @description Sets the content of the message.
   * @param {string} s - The content to set.
   * @returns {AiMessage} This instance for chaining.
   * @category Message Properties
   */
  setContent (s) {
    this.setValue(s)
    this.directDidUpdateNode()
    return this
  }

  /**
   * @description Generates a subtitle for the message.
   * @returns {string} The generated subtitle.
   * @category Message Properties
   */
  subtitle () {
    let s = this.content()
    if (Type.isNullOrUndefined(s)) {
      s = "";
    }

    const max = 40
    if (s.length > max) {
      s = this.content().slice(0, max) + "..."
    }
    return this.role() + "\n" + s
  }

  /**
   * @description Calculates an approximate token count for the message content.
   * @returns {number} The estimated token count.
   * @category Message Properties
   */
  tokenCount () {
    const s = this.content()
    if (Type.isNullOrUndefined(s)) {
      return 0
    }
    return Math.ceil(s.length / 4); // approximation
  }

  /**
   * @description Gets the service associated with the conversation.
   * @returns {Object} The service object.
   * @category Service
   */
  service () {
    return this.conversation().service();
  }

  /**
   * @description Generates a JSON representation of the message for the service.
   * @returns {Object} JSON object with role and content.
   * @category JSON
   */
  messagesJson () {
    return {
      role: this.service().serviceRoleNameForRole(this.role()),
      content: this.contentVisisbleToAi()
    }
  }

  /**
   * @description Gets the content visible to the AI.
   * @returns {string} The content visible to the AI.
   * @category Message Properties
   */
  contentVisisbleToAi () {
    return this.content()
  }

  /**
   * @description Checks if a response can be requested.
   * @returns {boolean} True if a response can be requested, false otherwise.
   * @category Actions
   */
  canRequestResponse () {
    return this.isVisibleToAi()
  }

  /**
   * @description Provides information for the request response action.
   * @returns {Object} Action information object.
   * @category Actions
   */
  requestResponseActionInfo () {
    return {
        isEnabled: this.canRequestResponse(),
        //title: "",
        isVisible: this.canRequestResponse()
    }
  }

  /**
   * @description Placeholder method for sending a message.
   * @throws {Error} Always throws an error indicating to use requestResponse instead.
   * @category Actions
   */
  send () {
    throw new Error("use requestResponse instead");
  }

  /**
   * @description Gets the response message class for the conversation.
   * @returns {Class} The response message class.
   * @category Message Properties
   */
  responseMsgClass () {
    return this.conversation().responseMsgClass();
  }

  /**
   * @description Requests a response from the AI.
   * @returns {Object} The response message object.
   * @category Actions
   */
  requestResponse () {
    //debugger;
    const response = this.conversation().newMessageOfClass(this.responseMsgClass());
    this.conversation().addSubnode(response);
    response.setSpeakerName(this.conversation().aiSpeakerName());
    //this.conversation().postShouldFocusSubnode(responseMessage)
    response.makeRequest();
    return response;
  }

  /**
   * @description Gets the error message if there's an error in the value.
   * @returns {string|null} The error message or null if no error.
   * @category Error Handling
   */
  valueError () {
    const e = this.error()
    return e ? e.message : null
  }

  /**
   * @description Called when the message is complete.
   * @category Lifecycle
   */
  onComplete () {
    super.onComplete() // sends a delegate message
    // to be overridden by subclasses
  }
  
  /**
   * @description Handles input value changes.
   * @category Event Handling
   */
  onValueInput () {
    this.requestResponse()
  }

  /**
   * @description Generates a JSON message for updates.
   * @returns {Object} JSON object with name and payload.
   * @category JSON
   */
  jsonMsgForSet () {
    return {
      name: "updateAiChatMessage",
      payload: this.jsonArchive()
    }
  }

  /**
   * @description Cleans up the message if it's incomplete.
   * @category Cleanup
   */
  cleanupIfIncomplete () {
    super.cleanupIfIncomplete();
    if (!this.isComplete()) {
      if (this.role() === "user") {
        this.cleanupUserMessage();
      } else {
        this.cleanupAssistantMessage();
      }
    }
  }

  /**
   * @description Cleans up an incomplete assistant message.
   * @category Cleanup
   */
  cleanupAssistantMessage () {
    if (this.type() === "AiResponseMessage") {
    //if (this.type() !== "HwRollRequestMessage" && this.type() !== "HwImageMessage") {
      //debugger;
      // TODO: add sanity check before deleting
      this.deleteFollowingMessages(); 
      this.setContent("");
      this.makeRequest();
    }
  }

  /**
   * @description Cleans up an incomplete user message.
   * @category Cleanup
   */
  cleanupUserMessage () {
    //debugger;
    // TODO: add sanity check before deleting
    this.deleteFollowingMessages();
    this.requestResponse();
  }

}.initThisClass());