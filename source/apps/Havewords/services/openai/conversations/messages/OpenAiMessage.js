"use strict";

/* 
    OpenAiMessage

*/

(class OpenAiMessage extends BMStorableNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("role", "system"); 
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setValidValues(this.validRoles())
      slot.setIsSubnodeField(true)
    }

    {
      const slot = this.newSlot("content", "");
      slot.setInspectorPath("")
      //slot.setLabel("role")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    {
      const slot = this.newSlot("request", null);
    }

    {
      const slot = this.newSlot("isResponse", null);
    }


    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setTitle("Message")
    this.setCanDelete(true)
  }

  subtitle () {
    let s = this.content()
    if (s.length > 15) {
      s = this.content().slice(0, 15) + "..."
    }
    return this.role() + ": " + s
  }

  tokenCount () {
    const s = this.content()
    if (s === null) {
      return 0
    }
    return Math.ceil(s.length / 4); // approximation
  }

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

  sendRequest () {
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    assert(i !== -1)
    const json = messages.slice(i).map(m => m.openAiJson())
    
  }

  openAiJson () {
    return {
      role: this.role(),
      content: this.content()
    }
  }

}.initThisClass());
