"use strict";

/* 
    Conversation

*/

(class Conversation extends BMStorableNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("footerNode", null);
    }

    {
      //const slot = this.newSlot("delegate", null);
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

  onChatInputValue (v) {
    const m = this.newMessage()
    m.setContent(v)
    this.scheduleMethod("clearInput", 2) 
    //this.footerNode().setValueIsEditable(false)
  }

  clearInput () {
    this.footerNode().setValue("")
  }

  // --- json ---

  jsonArchive () {
    const msgsJson = []
    this.messages().forEach(msg => {
      msgsJson.push(msg.jsonArchive())
    })
    assert(Type.isArray(msgsJson))

    const json = {
      type: this.type(),
      messages: msgsJson
    }
    return json
  }

  setJsonArchive (json) {
    debugger;
    this.removeAllSubnodes()

    assert(Type.isArray(json.messages))

    const messages = json.messages.forEach(msgJson => {
      const msgClass = getGlobalThis()[msgJson.type];
      assert(msgClass);
      this.updateMessageJson(msgJson) // not efficient

      //const msg = msgClass.clone().setConversation(this).setJsonArcive(msgJson);
      //this.addSubnode(msg)
    });
    return this
  }

  messageWithId (chatMessageId) {
    return this.messages().detect(msg => msg.chatMessageId() === chatMessageId)
  }

  updateMessageJson (msgJson) {
    const m = this.messageWithId(msgJson.chatMessageId)
    if (m) {
      m.setJsonArchive(msgJson)
    } else {
      // add message
      const newMsg = this.newMessage()
      newMsg.setJsonArchive(msgJson)
      SimpleSynth.clone().playReceiveBeep()
      //console.warn(this.typeId() + " updateMessageJson no message found with chatMessageId '" + chatMessageId + "'")
    }
  }

}.initThisClass());
