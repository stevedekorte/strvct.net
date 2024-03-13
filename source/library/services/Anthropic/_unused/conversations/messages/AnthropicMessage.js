"use strict";

/* 
    AnthropicMessage

*/

(class AnthropicMessage extends AiMessage {
  initPrototypeSlots() {
  }

  finalInit () {
    super.finalInit();
    //this.setRole(this.userRoleName());
  }

  /*
  messagesJson () {
    let role = this.role();
    if (role === "user") {
      //role = "human";
    }
    return {
      role: role,
      content: this.contentVisisbleToAi()
    }
  }
  */

}.initThisClass());
