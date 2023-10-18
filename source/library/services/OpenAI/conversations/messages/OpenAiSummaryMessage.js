"use strict";

/* 
    OpenAiSummaryMessage

*/

(class OpenAiSummaryMessage extends OpenAiMessage {
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

}.initThisClass());
