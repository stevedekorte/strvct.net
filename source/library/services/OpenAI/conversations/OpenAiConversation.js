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

  subviewsScrollSticksToBottom () {
    return true
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

  onMessageWillUpdate (aMsg) {
    // note if the scroll view position is at the end or beginning before we update the message
    this.postNoteNamed("onRequestMarkScrollPoint")
    // after we update the message, if it was at the end, we'll request to scroll to the end 
  }

  onMessageUpdate (aMsg) {
    // sent for things like streaming updates
    // can be useful for sharing the changes with other clients
    this.postNoteNamed("onRequestScrollToBottom")
    //this.postNoteNamed("onRequestScrollToBottomIfMarkAtBottom")
  }

  onMessageComplete (Msg) {
    this.postNoteNamed("onRequestScrollToBottom")
    this.checkTokenCount()
  }

  checkTokenCount () {
    this.updateTokenCount()
    const tc = this.tokenCount()
    console.log("token count: ", tc)
    if (tc > this.maxTokenCount()*0.9) {
      // time to compact
    }
  }

  compactTokens () {

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
