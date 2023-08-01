"use strict";

/* 
    GroupChatColumn

*/

(class GroupChatColumn extends ColumnView {
  initPrototypeSlots() {
    this.newSlot("chatInput", null);
  }

  init() {
    super.init();
    this.setId("GroupChatColumn");
    this.setupMessageInput();
    this.setScrollView(ScrollView.clone().setId("GroupChatColumn_ScrollView"));
  }

  setupMessageInput() {
    const textArea = TextAreaInputView.clone()
      .setId("chatInput")
      .setSubmitFunc(() => {
        this.sendChatMessage();
      });

    this.setChatInput(textArea);
  }

  addChatMessage(type, message, nickname, userId) {
    assert(message);

    const avatar = Session.shared().getUserAvatar(userId);

    const m = MessageView.clone()
    m.setAvatar(avatar)
    m.setNickname(nickname)
    m.setText(message)
    this.addMessageView(m);
  }

  addMessageView(aView) {
    this.scrollView().addItemView(aView);
    setTimeout(() => {
      this.scrollView().scrollToBottom();
    }, 10);
  }

  // ----------------------------------------------

  sendChatMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value;
    Sounds.shared().playSendBeep();

    if (message.trim() !== "") {
      input.value = "";

      if (App.shared().isHost()) {
        // Add chat to chat history
        Session.shared().addToHistory({
          type: "chat",
          data: message,
          id: LocalUser.shared().id(),
          nickname: LocalUser.shared().nickname(),
        });
        // Display chat message
        this.addLocalChatMessage(message);
        // Broadcast chat message to all connected guests

        HostSession.shared().broadcast({
          type: "chat",
          id: LocalUser.shared().id(),
          message: message,
          nickname: LocalUser.shared().nickname(),
        });
      } else {
        // Send chat message to host
        GuestSession.shared().send({
          type: "chat",
          id: LocalUser.shared().id(),
          message: message,
          nickname: LocalUser.shared().nickname(),
        });
        this.guestAddLocalChatMessage(message);
      }
    }
  }

  addLocalChatMessage(message) {
    Session.shared().addToHistory({
      type: "chat",
      data: message,
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
    });
    GroupChatColumn.shared().addChatMessage(
      "chat",
      message,
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
  }

  guestAddLocalChatMessage(message) {
    GroupChatColumn.shared().addChatMessage(
      "chat",
      message,
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
  }
}.initThisClass());

GroupChatColumn.shared();
