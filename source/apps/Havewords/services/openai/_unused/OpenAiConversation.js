"use strict";

/* 
    OpenAiConversation

*/

(class OpenAiConversation extends BMStorableNode {
  initPrototypeSlots() {
    this.newSlot("conversationHistory", null);
    this.newSlot("tokenBuffer", 400); // Buffer to ensure approximation doesn't exceed limit
    this.newSlot("initialMessagesCount", 3); // Number of initial messages to always keep
  }

  init() {
    super.init();
    this.setConversationHistory([]);
  }

  // ----------------------------

  // Function to approximate token count
  approximateTokens(message) {
    return Math.ceil(message.length / 4);
  }

  addToConversation(json) {
    assert(this.validRoles().indexOf(json.role) !== -1);

    // Check if conversation length exceeds limit
    let currentTokenCount = this.conversationHistory().reduce((count, message) => {
      return count + this.approximateTokens(message.content);
    }, 0);

    const newMessageTokenCount = this.approximateTokens(json.content);

    // If new message would cause token count to exceed limit, remove old messages
    while (this.conversationHistory().length > this.initialMessagesCount() &&
      currentTokenCount + newMessageTokenCount + this.tokenBuffer() > 4096) {
      // Remove the oldest non-initial message
      const removedMessage = this.conversationHistory().splice(this.initialMessagesCount(), 1)[0];
      currentTokenCount -= this.approximateTokens(removedMessage.content);
    }

    this.conversationHistory().push(json);
    return this;
  }

  clearConversationHistory() {
    this.setConversationHistory([]);
    return this;
  }

  addResponseText (text) {
    // Add the assistant's response to the conversation history
    this.addToConversation({
      role: "assistant",
      content: text,
    });

    // Save the conversation history to local storage
    Session.shared().addToHistory({
      type: "aiResponse",
      data: text,
      id: LocalUser.shared().id(),
      nickname: SessionOptionsView.shared().selectedModelNickname(),
    });
    return this;
  }

}.initThisClass());
