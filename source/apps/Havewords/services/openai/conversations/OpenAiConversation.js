"use strict";

/* 
    OpenAiConversation

*/

(class OpenAiConversation extends BMStorableNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("tokenBuffer", 400); // Buffer to ensure approximation doesn't exceed limit
    }

    {
      const slot = this.newSlot("tokenCount", 0); // sum of tokens of all messages
    }

    {
      const slot = this.newSlot("initialMessagesCount", 3); // Number of initial messages to always keep
    }

    {
      const slot = this.newSlot("model", null); 
    }

    //this.setSubnodeClasses([OpenAiMessage])
  }

  init() {
    super.init();
    this.addAction("add")
    this.setCanDelete(true)
    this.setNodeCanEditTitle(true)
    this.setTitle("Untitled")
    this.setSubtitle("conversation")
    this.setNodeCanReorderSubnodes(true)
  }

  finalInit () {
    super.finalInit()
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(true)
    this.setSubnodeClasses([OpenAiMessage])
  }

  conversations () {
    return this.parentNode()
  }

  messages () {
    return this.subnodes()
  }

  updateTokenCount () {
    const count = this.subnodes().sum(message => message.tokenCount())
    this.setTokenCount(count)
    return this
  }

  trimConversation() {
    // todo - implement
    return this;
  }

  selectedModel () {
    return "gpt-4";
  }

  newMessage () {
    const message = OpenAiMessage.clone().setRole("user")
    this.addSubnode(message)
    return message
  }

}.initThisClass());
