"use strict";

/* 
    GroupChatDataMessage

    A group chat message.

*/

(class GroupChatDataMessage extends Base {

  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.newMessageFieldSlot("id", null);
    this.newMessageFieldSlot("nickname", null);
    this.newMessageFieldSlot("message", null);
    this.setIsDebugging(true);
  }

  send () {
    if (App.shared().isHost()) {
      PeerServer.shared().broadcast(this.json())
    } else {

      PeerServer.shared().send(this.json())
    }
  }

  onReceived (json) {
    Sounds.shared().playReceiveBeep();
  }

  getAvatar () {
    return App.shared().session().getUserAvatar(this.id());
  }

  newView() {
    const m = MessageView.clone();
    m.setAvatar(this.getAvatar())
    m.setNickname(this.nickname())
    m.setText(this.message())
    return m
  }

}).initThisClass();
