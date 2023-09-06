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

  }

  init() {
    super.init();
    this.addNodeAction("add")
    this.setCanDelete(true)
    this.setNodeCanEditTitle(true)
    this.setTitle("Untitled")
    this.setSubtitle("conversation")
    this.setNodeCanReorderSubnodes(false)
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(true)
    this.setSubnodeClasses([OpenAiMessage])
  }

  /*
  finalInit () {
    super.finalInit()
  }
  */

  service () {
    return this.conversations().service()
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
    const msgClass = this.subnodeClasses().first()
    const message = msgClass.clone().setRole("user")
    this.addSubnode(message)
    return message
  }

  clear () {
    this.removeAllSubnodes()
    return this
  } 

}.initThisClass());
