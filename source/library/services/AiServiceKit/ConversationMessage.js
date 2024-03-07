"use strict";

/* 
    ConversationMessage

*/

(class ConversationMessage extends BMTextAreaField {
  initPrototypeSlots() {

    {
      const slot = this.overrideSlot("key")
      slot.setAnnotation("shouldJsonArchive", true);
      slot.setCanInspect(true);
      slot.setSlotType("String");
    }

    {
      const slot = this.overrideSlot("value");
      slot.setAnnotation("shouldJsonArchive", true);
      slot.setCanInspect(true);
      slot.setInspectorPath("Node/Field/Value");
      slot.setSlotType("String");
    }

    {
      const slot = this.newSlot("conversation", null);
      slot.setCanInspect(false);
      slot.setShouldStoreSlot(false);
    }

    {
      const slot = this.newSlot("messageId", null);
      slot.setAnnotation("shouldJsonArchive", true)
      slot.setCanInspect(true);
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true);
      slot.setSlotType("String");
    }

    {
      const slot = this.newSlot("senderId", null);
      slot.setSlotType("String");
      slot.setCanInspect(true);
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true)
      slot.setAnnotation("shouldJsonArchive", true)
    }

    {
      const slot = this.newSlot("inReplyToMessageId", null);
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setCanInspect(true);
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true)
      slot.setSlotType("String");
      slot.setAnnotation("shouldJsonArchive", true)
    }

    {
      const slot = this.newSlot("timestamp", null);
      slot.setCanInspect(true);
      slot.setDuplicateOp("duplicate");
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true)
      slot.setSlotType("Number");
      //slot.setAnnotation("shouldJsonArchive", true)
    }

    /*
    {
      const slot = this.newSlot("annotations", null); // a place for any sort of extra JSON info
      slot.setShouldStoreSlot(true)
      slot.setAnnotation("shouldJsonArchive", false)
    }
    */

    {
      const slot = this.newSlot("isComplete", false);
      slot.setAnnotation("shouldJsonArchive", true)
      slot.setCanInspect(true);
      //slot.setDoesHookSetter(true); // no longer needed?
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true);
      slot.setSlotType("Boolean");
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("error", null);
      slot.setCanInspect(false);
      slot.setShouldStoreSlot(true);
    }

    {
      const slot = this.newSlot("isVisibleToUser", true);
      slot.setCanInspect(true);
      slot.setInspectorPath("ConversationMessage");
      slot.setSlotType("Boolean");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("delegate", null);
      slot.setCanInspect(false);
      slot.setShouldStoreSlot(false)
    }

    {
      const slot = this.newSlot("deleteAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Delete");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setCanInspect(true)
      slot.setActionMethodName("delete");
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  init () {
    super.init();
    this.setContent("")
    this.setCanDelete(true)
    //this.setAnnotations({})
  }

  finalInit () {
    super.finalInit();
    this.setNodeTileClassName("BMChatInputTile")
    //this.setOverrideSubviewProto(this.nodeTileClass())
    this.setKeyIsVisible(true)
    this.createIdIfAbsent()
  }

  createIdIfAbsent () {
    if (!this.messageId()) {
      this.setMessageId(Object.newUuid())
    }
  }

  inReplyToMessage () {
    const id = this.inReplyToMessageId();
    if (id) {
      return this.conversation().messageWithId(id);
    }
    return null
  }

  replies () {
    const mid = this.messageId()
    return this.conversation().messages().select(m => m.inReplyToMessageId() === mid)
  }

  didUpdateSlotIsComplete (oldValue, newValue) {
    //debugger;
    if(newValue && this.conversation()) { // so not called during deserialization
      this.scheduleMethod("onComplete");
    }
  }

  onComplete () {
    // to be overridden by subclasses
    this.sendDelegate("onCompletedMessage")
  }

  setSendInConversation (v) {
    debugger;
  }

  valueIsEditable () {
    return true
  }

  content () {
    return this.value()
  }

  setValue (s) {
    super.setValue(s)
    this.directDidUpdateNode() // so updates trigger UI refresh
    return this
  }

  setContent (s) {
    this.setValue(s)
    //this.directDidUpdateNode()
    return this
  }

  subtitle () {
    let s = this.content()
    const max = 40
    if (s.length > max) {
      s = this.content().slice(0, max) + "..."
    }
    return this.speakerName() + "\n" + s
  }

  speakerName () {
    return this.key()
  }

  setSpeakerName (s) {
    return this.setKey(s)
  }

  // --- conversation history ---

  // --- previous ---

  visiblePreviousMessages () {
    // subclasses should override for different behaviors
    return this.previousMessages()
  }

  previousMessages () {
    const msgs = this.conversation().messages();
    assert(msgs.includes(this));
    return msgs.before(this);
  }

  /*
  history () {
    // previous messqages + this message
    // doing it this way gives each message (and message sublclass a chance to filter messages
    const pm = this.previousMessage();
    const history = pm ? pm.history() : [];
    history.push(this);
    return history;
  }
  */

  previousMessagesIncludingSelf () {
    const messages = this.previousMessages();
    messages.push(this);
    return messages;
  }

  previousMessage () {
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    if (i > -1) {
      return messages[i-1]
    }
    return null
  }

  // --- following ---

  followingMessages () {
    return this.conversation().messages().after(this);
  }

  followingMessagesIncludingSelf () {
    const messages = this.followingMessages();
    messages.unshift(this);
    return messages;
  }

  // --- sending ---

  send () {
  }

  valueError () {
    const e = this.error()
    return e ? e.message : null
  }

  onValueInput () {
    this.requestResponse()
  }

  /*
  cssVariableDict () {
    return {
      //"background-color": "var(--body-background-color)",
      //"color": "var(--body-color)",
      //"--body-background-color": "inherit"
    }
  }
  */

  delegate () {
    if (!this._delegate) {
      return this.conversation()
    }
    return this._delegate
  }

  sendDelegate (methodName, args = [this]) {
    const d = this.delegate()
    if (d) {
      const f = d[methodName]
      if (f) {
        f.apply(d, args)
        return true
      }
    }
    return false
  }

}.initThisClass());
