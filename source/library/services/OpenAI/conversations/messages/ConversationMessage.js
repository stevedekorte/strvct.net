"use strict";

/* 
    ConversationMessage

*/

(class ConversationMessage extends BMTextAreaField {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("conversation", null);
      slot.setShouldStoreSlot(false)
    }

    {
      const slot = this.newSlot("chatMessageId", null);
      slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("isComplete", false);
      slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("error", null);
      slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("delegate", null);
      slot.setShouldStoreSlot(false)
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  init () {
    super.init();
    this.setContent("")
    this.setCanDelete(true)
  }

  finalInit () {
    super.finalInit();
    this.setNodeTileClassName("BMChatInputTile")
    //this.setOverrideSubviewProto(this.nodeTileClass())
    this.setKeyIsVisible(true)
    this.setKey("Speaker")
    this.createIdIfAbsent()
  }

  createIdIfAbsent () {
    if (!this.chatMessageId()) {
      this.setChatMessageId(Object.newUuid())
    }
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

  setContent (s) {
    this.setValue(s)
    this.directDidUpdateNode()
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

  conversation () {
    return this.parentNode()
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
    const json = this.previousMessages().map(m => m.openAiJson())
    return json
  }

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

  jsonArchive () {
    // TODO: automate with a slot attribute?
    assert(this.chatMessageId())
    assert(this.speakerName())
    assert(this.content())
    
    return {
      type: this.type(),
      chatMessageId: this.chatMessageId(),
      speakerName: this.speakerName(),
      content: this.content(),
      isComplete: this.isComplete()
    }
  }

  setJsonArchive (json) {

    assert(Type.isString(json.chatMessageId));
    this.setChatMessageId(json.chatMessageId);

    assert(Type.isString(json.speakerName));
    this.setSpeakerName(json.speakerName);

    assert(Type.isString(json.content));
    this.setContent(json.content);

    assert(Type.isBoolean(json.isComplete));
    this.setIsComplete(json.isComplete);

    return this
  }

}.initThisClass());
