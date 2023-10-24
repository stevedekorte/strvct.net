"use strict";

/* 
    ConversationMessage

*/

(class ConversationMessage extends BMTextAreaField {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("chatMessageId", null);
      slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("conversation", null);
      slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("error", null);
      slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("delegate", null);
      slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("isComplete", false);
      slot.setShouldStoreSlot(true)
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
    return this.role() + "\n" + s
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
    return this.sendInConversation()
  }

  async sendInConversation () {
    if (!this.request()) {
      const message = this.conversation().newMessage()
      message.setRole("assistant")
      //this.conversation().postShouldFocusSubnode(message)
      message.makeRequest()
    }
  }

  valueError () {
    const e = this.error()
    return e ? e.message : null
  }

  onRequestComplete (aRequest) {
    //this.setRequest(null)
    //this.setStatus("complete")
    this.setIsComplete(true)
    this.setNote(null)
    this.sendDelegate("onMessageComplete")
  }
  
  onStreamData (request, newContent) {
    this.sendDelegate("onMessageWillUpdate")

    this.setContent(request.fullContent())
    this.sendDelegate("onMessageUpdate")
  }
  
  onStreamComplete (request) {
    this.setContent(request.fullContent())
    this.sendDelegate("onMessageUpdate")
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

}.initThisClass());
