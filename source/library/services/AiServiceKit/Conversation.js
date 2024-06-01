"use strict";

/* 
    Conversation

*/

(class Conversation extends BMStorableNode {
  initPrototypeSlots () {

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
      const f = ChatInputNode.clone();
      f.setCanDelete(false);
      f.setConversation(this);
      f.setHasValueButton(true);
      this.setFooterNode(f);
    }

    this.setNodeChildrenAlignment("flex-start") // make the messages stick to the bottom
  }

  onChatEditValue (v) {
    // for subclasses to override
  }

  /*
  nodeFillsRemainingWidth () {
    return true;
  }
  */

  subviewsScrollSticksToBottom () {
    return true;
  }

  finalInit () {
    super.finalInit();
    try {
     // assert(this.subnodeClasses().length > 0, this.type() + " has no subnode classes");
      this.messages().forEach(m => {
        //assert(this.subnodeClasses().includes(m.thisClass()), m.type() + " is not in " + JSON.stringify(this.subnodeClasses().map(c => c.type())));
        if(!m.setConversation) {
          debugger;
          throw new Error(m.type() + " missing setConversation() ");
        }
      });
    } catch (error) {
      //debugger;
      console.log(this.type() + " finalInit error: " + error.message);
      this.removeAllSubnodes();
    }
    //debugger;
    this.messages().forEach(m => m.setConversation(this));
    this.setNodeCanAddSubnode(false);
    //this.setNodeFillsRemainingWidth(true);
    this.setNodeChildrenAlignment("flex-end");
    this.setCanDelete(true);
  }

  // --- messages ---

  messages () {
    return this.subnodes()
  }

  clear () {
    this.subnodes().forEach(msg => { 
      if (msg.shutdown) { 
        msg.shutdown() 
      }
    });
    this.removeAllSubnodes();
    return this
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

  // -- creating new messages ---

  newMessageOfClass (msgClass) {
    const m = msgClass.clone();
    m.setConversation(this);
    return m;
  }

  // -- new message instances ---

  newMessage () {
    const msgClass = this.subnodeClasses().first();
    const m = this.newMessageOfClass(msgClass);
    this.addSubnode(m);
    return m;
  }

  // --- chat input ---

  acceptsChatInput () {
    return true;
  }

  onChatInputValue (v) {
    debugger;
    if (!this.acceptsChatInput()) {
      console.warn(this.type() + " does not accept chat input");
      return;
    }
    const m = this.newMessage();
    m.setContent(v);
    m.setIsComplete(true);
    //this.footerNode().setValueIsEditable(false)
  }

  setChatInputIsEnabled (aBool) {
    this.footerNode().setValueIsEditable(aBool);
    return this
  }

  clearInput () {
    debugger; // shouldn't need this as TextField has option to do this
  }

  // --- json ---

  jsonArchive () {
    const msgsJson = [];
    this.messages().forEach(msg => {
      msgsJson.push(msg.jsonArchive());
    }) // we don't use map because it returns a SubnodesArray instance...
    assert(Type.isArray(msgsJson));

    const json = {
      type: this.type(),
      messages: msgsJson
    };
    return json;
  }

  setJsonArchive (json) {
    assert(Type.isArray(json.messages)); // sanity check

    this.removeAllSubnodes();

    json.messages.forEach(msgJson => {
      this.newMessageFromJson(msgJson);
    });
    return this;
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
    const oldMsg = this.messageWithId(msgJson.messageId);

    if (oldMsg) {
      oldMsg.setJsonArchive(msgJson)
      return oldMsg
    } else {
      const newMsg = this.newMessageFromJson(msgJson);
      if (newMsg.onNewFromNetwork) {
        newMsg.scheduleMethod("onNewFromNetwork");
      }
      SimpleSynth.clone().playReceiveBeep();
      this.onNewMessageFromUpdate(newMsg);
      //console.warn(this.typeId() + " updateMessageJson no message found with messageId '" + messageId + "'");
      return newMsg;
    }
  }

  onNewMessageFromUpdate (newMsg) {
    // for subclasses to override
  }

  // --- enable / disable input ---

  /*
  disableInput () {
    this.footerNode().disableEnter();
    return this
  }

  enableInput () {
    this.footerNode().enableEnter();
    return this
  }
  */

}.initThisClass());
