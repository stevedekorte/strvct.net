"use strict";

/* 
    OpenAiSummaryRequestMessage

*/

(class OpenAiSummaryRequestMessage extends OpenAiResponseMessage {
  initPrototypeSlots() {
    {
      const slot = this.newSlot("parentMessage", null);
      slot.setShouldStoreSlot(true)
    }
  }

  init () {
    super.init();
  }

  finalInit () {
    super.finalInit();
  }

  conversationHistoryPriorToSelfJson () {
    return this.parentMessage().conversationHistoryPriorToSelfJson()
  }

    // --- summary ---
  /*
  newSummaryMessage () {
    const m = this.thisClass().clone()
    m.setRole("user")
    m.setContent(this.summaryRequestPrompt())
    m.setConversation(this.conversation())
    return m
  }

  sendSummaryMessage () {
    if (!this.summaryMessage()) {
      this.setNote("sending summary request")
      const m = this.newSummaryMessage()
      this.setSummaryMessage(m)
    }
  }

  summaryRequestPrompt () {
    return `Please write a concise summary of the previous chat history 
    which includes any details necessary to adequately continue the conversation 
    without the complete chat history. Start the summary with the title: "SUMMARY OF STORY SO FAR:"`
  }

  // --- conversation summary ---

  summaryRequestPrompt_2 () {
    return `Please write a concise summary of this adventure's history containing any details a 
    DM would need to continue the adventure without having the complete chat history. 
    Be sure to include any (still existing) monsters/NPCs and their character sheets, 
    any items of interest that the player has encountered, and
    the current location of the players and any important details about that location.`
  }

  */

}.initThisClass());
