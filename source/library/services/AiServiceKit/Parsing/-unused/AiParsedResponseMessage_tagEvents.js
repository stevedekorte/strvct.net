"use strict";

/*

    AiParsedResponseMessage_tagEvents

*/

(class AiParsedResponseMessage_tagEvents extends AiParsedResponseMessage {

  onStream_toolCall_TagText (innerTagString) {
    debugger;
    this.conversation().assistantToolKit().handleToolCallTagFromMessage(innerTagString, this);
  }

}).initThisCategory();


