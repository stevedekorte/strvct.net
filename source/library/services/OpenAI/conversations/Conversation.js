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

    this.setNodeChildrenAlignment("flex-start") // make the messages stick to the bottom
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
    this.setNodeChildrenAlignment("flex-end")
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
    // e.g. sent by OpenAiMessage for things like streaming updates
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

  onCompletedMessage (aMsg) {

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
    //this.footerNode().setValueIsEditable(false)
  }

  clearInput () {
    debugger; // shouldn't need this as TextField has option to do this
  }

  // --- json ---

  jsonArchive () {
    const msgsJson = []
    this.messages().forEach(msg => {
      msgsJson.push(msg.jsonArchive())
    }) // we don't use map because it returns a SubnodesArray instance...
    assert(Type.isArray(msgsJson))

    const json = {
      type: this.type(),
      messages: msgsJson
    }
    return json
  }

  setJsonArchive (json) {
    assert(Type.isArray(json.messages)) // sanity check

    this.removeAllSubnodes()

    json.messages.forEach(msgJson => {
      this.newMessageFromJson(msgJson)
    });
    return this
  }

  messageWithId (messageId) {
    return this.messages().detect(msg => msg.messageId() === messageId)
  }

  newMessageFromJson (msgJson) {
    const msg = ConversationMessage.fromJsonArchive(msgJson)
    msg.setConversation(this)
    this.addSubnode(msg)
    return msg
  }

  updateMessageJson (msgJson) {
    const oldMsg = this.messageWithId(msgJson.messageId)
    if (oldMsg) {
      oldMsg.setJsonArchive(msgJson)
      return oldMsgm
    }

    const newMsg = this.newMessageFromJson(msgJson)
    SimpleSynth.clone().playReceiveBeep()
    this.onNewMessageFromUpdate(newMsg)
    //console.warn(this.typeId() + " updateMessageJson no message found with messageId '" + messageId + "'")
    return newMsg
  }

  onNewMessageFromUpdate (newMsg) {
    // for subclasses to override
  }

}.initThisClass());