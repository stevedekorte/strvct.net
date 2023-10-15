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

    {
      const slot = this.newSlot("footerNode", null);
    }
  }

  init() {
    super.init();
    //this.addNodeAction("add")
    this.setCanDelete(true)
    this.setNodeCanEditTitle(true)
    this.setTitle("Untitled")
    this.setSubtitle("conversation")
    this.setNodeCanReorderSubnodes(false)
    this.setShouldStore(true)
    this.setShouldStoreSubnodes(true)
    this.setSubnodeClasses([OpenAiMessage])

    {
      const f = ChatInputNode.clone()
      f.setCanDelete(false)
      f.setConversation(this)
      this.setFooterNode(f)
    }
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

  onUpdateMessage (aMsg) {
    // sent for things like streaming updates
    // can be useful for sharing the changes with other clients
    this.postNoteNamed("onRequestScrollToBottom")
  }

  onChatInput (chatInputNode) {
    const v = chatInputNode.value()
    if (v) {
      const m = this.newMessage()
      m.setRole("user")
      m.setValue(v)
      m.sendInConversation()
      this.scheduleMethod("clearInput", 2) 
    }
  }

  clearInput () {
    this.footerNode().setValue("")
    this.postNoteNamed("onRequestScrollToBottom")
  }

}.initThisClass());
