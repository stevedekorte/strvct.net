"use strict";

/* 
    Conversation

*/

(class Conversation extends BMStorableNode {
  initPrototypeSlots() {

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

    this.setSubnodeClasses([])

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
    this.setCanAdd(false)
    this.setNodeFillsRemainingWidth(true)

    this.setCanDelete(true)
  }

  // --- messages ---

  messages () {
    return this.subnodes()
  }

  clear () {
    this.removeAllSubnodes()
    return this
  } 

  // we expect this message protocol to be sent to our conversation 

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

  // -------- ///////////////////////

  initNewMessage (aMessage) {
    return aMessage
  }

  justNewMessage () {
    const msgClass = this.subnodeClasses().first()
    const m = msgClass.clone()
    m.setConversation(this)
    this.initNewMessage(m)
    return m
  }

  newMessage () {
    const message = this.justNewMessage()
    this.addSubnode(message)
    return message
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
