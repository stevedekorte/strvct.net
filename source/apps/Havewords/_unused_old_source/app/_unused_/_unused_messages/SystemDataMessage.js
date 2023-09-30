"use strict";

/* 
    SystemDataMessage

    A system message.

*/

(class SystemDataMessage extends Base {

  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.newMessageFieldSlot("message", null);
    this.setIsDebugging(true);
  }

  send () {

    if (App.shared().isHost()) {

    } else {

    }
  }

  onReceived () {

  }

  newElement() {

  }

}).initThisClass();
