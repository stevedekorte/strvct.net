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
      const slot = this.newSlot("maxTokenCount", 8000); // max allowed by model
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

  nodeFillsRemainingWidth () {
    return true
  }

  subviewsScrollSticksToBottom () {
    return true
  }

  finalInit () {
    super.finalInit()
    this.messages().forEach(m => m.setConversation(this))
    this.removeNodeAction("add")
    this.setNodeFillsRemainingWidth(true)
  }

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

  justNewMessage () {
    const msgClass = this.subnodeClasses().first()
    const m = msgClass.clone().setRole("user")
    m.setConversation(this)
    return m
  }

  newMessage () {
    const message = this.justNewMessage()
    this.addSubnode(message)
    return message
  }

  clear () {
    this.removeAllSubnodes()
    return this
  } 

  onMessageWillUpdate (aMsg) {
  }

  onMessageUpdate (aMsg) {
    // sent for things like streaming updates
    // can be useful for sharing the changes with other clients
  }

  onMessageComplete (aMsg) {
    this.footerNode().setValueIsEditable(true)
    if (aMsg.error() === null) {
      const pmsg = aMsg.previousMessage() 
      /*
      if (pmsg && pmsg.value() === this.summaryRequestPrompt()) {
        // it's a response to a summary request
        //this.removeSubnodes(aMsg.previousMessages())
      }
      */
      this.checkTokenCount()
    }
  }

  checkTokenCount () {
    this.updateTokenCount()
    const tc = this.tokenCount()
    console.log("token count: ", tc)
    if (tc > this.maxTokenCount() * 0.9) {
      this.compactTokens()
    }
  }

  compactTokens () {
    const m = this.messages().last()
    m.sendSummaryMessage()
  }

  onChatInput (chatInputNode) {
    const v = chatInputNode.value()
    if (v) {
      const m = this.newMessage()
      m.setRole("user")
      m.setContent(v)
      m.sendInConversation()
      this.scheduleMethod("clearInput", 2) 
      this.footerNode().setValueIsEditable(false)
      return m
    }
    return null
  }

  clearInput () {
    this.footerNode().setValue("")
  }

}.initThisClass());
