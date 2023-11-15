"use strict";

/* 
    ConversationMessage

*/

(class ConversationMessage extends BMTextAreaField {
  initPrototypeSlots() {

    this.slotNamed("key").setAnnotation("shouldJsonArchive", true)
    this.slotNamed("value").setAnnotation("shouldJsonArchive", true)

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
      slot.setInspectorPath("ConversationMessage");
      slot.setShouldStoreSlot(true);
      slot.setSlotType("Boolean");
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
    }

    {
      const slot = this.newSlot("delegate", null);
      slot.setCanInspect(false);
      slot.setShouldStoreSlot(false)
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

  setIsComplete (aBool) {
    if (this._isComplete !== aBool) {
      if (aBool) {
        this.onComplete()
      }
      this._isComplete = aBool;
    }
    return this
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

  previousMessages () {
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    assert(i !== -1)
    return messages.slice(0, i)
  }

  previousMessagesIncludingSelf () {
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    assert(i !== -1)
    return messages.slice(0, i+1)
  }

  previousMessage () {
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    if (i > -1) {
      return messages[i-1]
    }
    return null
  }

  conversationHistoryPriorToSelfJson () {
    // return json for all messages in conversation up to this point (unless they are marked as hidden?)
    const json = this.previousMessages().select(m => m.isVisibleToAi()).map(m => m.openAiJson())
    return json
  }

  /*
  conversationHistoryPriorToSelfJson () {
    // return json for all messages in conversation up to this point (unless they are marked as hidden?)
    const json = this.previousMessages().map(m => m.openAiJson())
    return json
  }
  */

  // --- sending ---

  send () {
  }

  valueError () {
    const e = this.error()
    return e ? e.message : null
  }

  onValueInput () {
    this.sendInConversation()
  }

  cssVariableDict () {
    return {
      //"background-color": "var(--body-background-color)",
      //"color": "var(--body-color)",
      //"--body-background-color": "inherit"
    }
  }

  centerDotsHtml () {
    return `<span class="dots"><span class="dot dot3">.</span><span class="dot dot2">.</span><span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>`;
  }

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

  // --- json ---
/*
  jsonArchive () {
    const jsonArchiveSlots = this.thisPrototype().slotsWithAnnotation("shouldJsonArchive", true) 
    const dict = {
      type: this.type()
    }

    jsonArchiveSlots.forEach(slot => {
      const k = slot.getterName()
      const v = slot.onInstanceGetValue(this)
      dict[k] = v;
    })

    console.log(this.typeId() + ".jsonArchive() = " + JSON.stringify(dict, 2, 2));

    return dict
  }

  setJsonArchive (json) {

    console.log(this.typeId() + ".setJsonArchive(" + JSON.stringify(json, 2, 2) + ")");

    const keys = Object.keys(json).select(key => key !== "type");
    const jsonArchiveSlots = this.thisPrototype().slotsWithAnnotation("shouldJsonArchive", true);
    assert(keys.length === jsonArchiveSlots.length); // or should we assume a diff if missing?
    
    jsonArchiveSlots.forEach(slot => {
      const k = slot.getterName()
      const v = json[k]
      slot.onInstanceSetValue(this, value);
    })

    return this
  }

  static fromJsonArchive (json) {
    const className = json.type;
    assert(className); // sanity check
    
    const aClass = getGlobalThis()[className];
    assert(aClass.isKindOf(this)); // sanity check

    const instance = aClass.clone().setJsonArchive(json)
    return instance
  }
  */

}.initThisClass());
