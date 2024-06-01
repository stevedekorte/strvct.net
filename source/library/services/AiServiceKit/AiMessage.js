"use strict";

/* 
    AiMessage

*/

(class AiMessage extends ConversationMessage {

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
  
  initPrototypeSlots () {

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

    {
      const slot = this.newSlot("isVisibleToAi", true);
      slot.setSlotType("Boolean");
      slot.setShouldStoreSlot(true);
      slot.setCanInspect(true);
      slot.setInspectorPath(this.type());
    }

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
  }

  init () {
    super.init();
    this.setContent("");
    this.setCanDelete(true);
  }

  /*
  finalInit () {
    super.finalInit();
  }
  */

  isResponse () {
    return false;
  }

  valueIsEditable () {
    return this.role() === "user";
  }

  aiSpeakerName () {
    return "LLM";
  }

  content () {
    return this.value()
  }

  setContent (s) {
    this.setValue(s)
    this.directDidUpdateNode()
    return this
  }

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

  tokenCount () {
    const s = this.content()
    if (Type.isNullOrUndefined(s)) {
      return 0
    }
    return Math.ceil(s.length / 4); // approximation
  }

  service () {
    return this.conversation().service();
  }

  messagesJson () {
    return {
      role: this.service().serviceRoleNameForRole(this.role()),
      content: this.contentVisisbleToAi()
    }
  }

  contentVisisbleToAi () {
    return this.content()
  }

  // --- request response action ---

  canRequestResponse () {
    return this.isVisibleToAi()
  }

  requestResponseActionInfo () {
    return {
        isEnabled: this.canRequestResponse(),
        //title: "",
        isVisible: this.canRequestResponse()
    }
  }

  send () {
    throw new Error("use requestResponse instead");
  }

  responseMsgClass () {
    return this.conversation().responseMsgClass();
  }

  requestResponse () {
    const response = this.conversation().newMessageOfClass(this.responseMsgClass());
    this.conversation().addSubnode(response);
    response.setSpeakerName(this.conversation().aiSpeakerName());
    //this.conversation().postShouldFocusSubnode(responseMessage)
    response.makeRequest();
    return response;
  }

  valueError () {
    const e = this.error()
    return e ? e.message : null
  }

  onComplete () {
    super.onComplete() // sends a delegate message
    // to be overridden by subclasses
  }
  
  onValueInput () {
    this.requestResponse()
  }

  // --- temporary ---

  jsonMsgForSet () {
    return {
      name: "updateAiChatMessage",
      payload: this.jsonArchive()
    }
  }

}.initThisClass());
