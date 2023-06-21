"use strict";

/* 
    GuestConnection

    This class is only used for Host sessions

*/

(class GuestConnection extends PeerConnection {
  initPrototypeSlots() {
    this.newSlot("pubkey", null); 
    this.newSlot("player", null); 
  }

  init() {
    super.init();
    this.setInfo({});
    this.setIsDebugging(true);
  }

  hostSession () {
    return HostSession.shared();
  }

  id () {
    return this.info().id;
  }

  setId (id) {
    this.info().id = id;
    return this;
  }

  // --- nickname ----

  nickname () {
    return this.player().nickname();
  }

  setNickName (s) {
    debugger;
    this.player().setNickname(s);
    return this;
  }
  
  // ----------------

  onOpen(peerId) {
    console.log(this.type() + " onOpen(" + peerId + ")");
    super.onOpen(peerId);

    /*
    if (this.hostSession().bannedGuests().has(this.id())) {
      this.send({ type: "ban" });
      setTimeout(() => this.shutdown(), 500);
    }
    */

    this.hostSession().onOpenGuestConnection(this);
  }

  onData(data) {
    this.debugLog("onData", data);
    data.peerId = this.peerId()

    const action = "onReceived_" + data.type;

    const method = this[action];
    if (method) {
      method.apply(this, [data]);
    } else {
      console.warn("WARNING: no " + this.type() + "." + action + "() method found");
      debugger;
    }
  }

  isBanned () {
    return this.hostSession().bannedGuests().has(this.id())
  }

  description () {
    return this.type() + " id: " + this.id() + " nick: " + this.nickname()
  }

  session () {
    return App.shared().session();
  }

  // --- player data ---

  onReceived_updatePlayer(data) {
    this.setInfo(data.player);
    const player = App.shared().session().players().updatePlayerJson(data.player);
    this.setPlayer(player);
  }

  // --- player data ---

  onReceived_remotePrompt(data) {
    // Add prompt to prompt history
    if (this.canSendPrompts()) {
      Session.shared().addToHistory({
        type: "prompt",
        data: data.message,
        id: data.id,
        nickname: data.nickname,
      });

      // Send prompt to guests
      this.hostSession().broadcastExceptTo(
        {
          type: "prompt",
          id: data.id,
          message: data.message,
          nickname: data.nickname,
        },
        data.peerId
      );

      // Display prompt
      AiChatColumn.shared().addMessage("prompt", data.message, data.nickname, data.id);

      // If in game mode, add username to prompt
      if (Session.shared().gameMode()) {
        let newMessage;
        newMessage = data.nickname + ": " + data.message;
        console.log("Game mode on, adding guest username to prompt");
        this.hostSession().sendAIResponse(newMessage);
      } else {
        this.hostSession().sendAIResponse(data.message);
      }
    } else {
      console.log(`Rejected prompt from ${conn.peer} - ${this.nickname()}`);
    }
  }

  onReceived_remoteSystemMessage(data) {
    // Add remote system message update to history if guest is allowed to send prompts
    if (this.canSendPrompts()) {
      Session.shared().addToHistory({
        type: "systemMessage",
        data: data.message,
        id: data.id,
        nickname: data.nickname,
      });
      // Update system message and display it TO DO SEND TO ALL
      AiChatColumn.shared().addMessage("systemMessage", data.message, data.nickname, data.id);
      this.hostSession().guestChangeSystemMessage(data);
    } else {
      console.log(
        `Rejected system message update from ${conn.peer} - ${data.nickname}`
      );
    }
  }
  
  onReceived_chat(data) {
    // Add chat to chat history
    Session.shared().addToHistory({
      type: "chat",
      data: data.message,
      id: data.id,
      nickname: data.nickname,
    });

    // Display chat message
    GroupChatColumn.shared().addChatMessage(
      data.type,
      data.message,
      data.nickname,
      data.id
    );

    // Broadcast chat message to all connected guests
    this.hostSession().broadcastExceptTo(
      {
        type: "chat",
        id: data.id,
        message: data.message,
        nickname: data.nickname,
      },
      data.peerId
    );
  }

  onClose() {
    super.onClose();

    if (!this.isBanned()) {
      this.hostSession().broadcast({
        type: "systemMessage",
        message: `${this.nickname()} has left the session.`,
        nickname: LocalUser.shared().nickname(),
      });

      GroupChatColumn.shared().addChatMessage(
        "systemMessage",
        `${this.nickname()} has left the session.`,
        LocalUser.shared().nickname(),
        this.id()
      );
    }

    //debugger;
    App.shared().session().players().removeSubnode(this.player());
    this.hostSession().sharePlayers();
  }
}).initThisClass();
