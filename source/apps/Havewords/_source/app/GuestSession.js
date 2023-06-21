"use strict";

/* 
    GuestSession

    Manages a guest's session and connection to it's host.
    

*/

(class GuestSession extends Base {
  initPrototypeSlots() {
    this.newSlot("hostId", null);
    this.newSlot("hostConnection", null);
  }

  init() {
    super.init();
    assert(!App.shared().isHost()); // Host sessions should never access this class
    this.setIsDebugging(true);
    this.setupPlayer();
  }

  setupPlayer () {
    const json = {
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
      avatar: LocalUser.shared().avatar(),
      data: { 
        name: LocalUser.shared().nickname(), 
        level: 3, 
        race: "Human", 
        class: "Fighter",
        alignment: "Neutral Neutral"
      }, 
    }
    App.shared().session().players().setJson([json]);
    //return json;
  }

  player () {
    console.log("LocalUser.shared().id(): ", LocalUser.shared().id());
    return App.shared().session().players().playerWithId(LocalUser.shared().id());
  }

  // --- connect ---

  joinSession(inviteId) {
    this.setHostId(inviteId);
    this.debugLog("joinSession " + inviteId);
    Session.shared().clear()
    //GroupChatColumn.shared().displayGuestHTMLChanges();
    this.connect();
  }

  peerId () {
    return PeerServer.shared().peerId();
  }

  connect() {
    const hostConnection = PeerServer.shared().connectToPeerId(this.hostId());
    hostConnection.setDelegate(this);
    this.setHostConnection(hostConnection);
  }

  onOpen() {
    this.sharePlayer();
  }

  async onData(data) {
    this.debugLog("onData", data);

    const action = "onReceived_" + data.type;

    const method = this[action];
    if (method) {
      /*
      const isValid = await LocalUser.shared().cryptoId().verifySignatureOnJson(data); // don't forget to also check if pubkey is correct!
      console.log("DATA:", data);
      console.log("SIG isValid:", isValid);
      */
      method.apply(this, [data]);
    } else {
      console.warn("WARNING: no " + this.type() + "." + action + "() method found");
    }
  }

  clearPlayers () {
    this.session().players().clear();
    PlayersColumn.shared().display();
  }

  // --- receive messages ---

  onReceived_playTrackId (data) {
    console.log("onReceived_playTrackId('" + data.trackId + "')");
    MusicPlayer.shared().playTrackId(data.trackId);
  }

  async onReceived_playAudioBlob(data) {
    console.log("onReceived_playAudioBlob()");
    const audioBlob = await Blob.asyncFromDataUrl(data.audioBlobDataUrl);
    AzureTextToSpeech.shared().queueAudioBlob(audioBlob);
  }

  onReceived_kick(data) {
    //this.hostConnection().shutdown();
    console.log("You have been kicked from the session.");
    GroupChatColumn.shared().addChatMessage(
      "chat",
      "You have been kicked from the session.",
      "System",
      data.id
    );
    document.getElementById("chatInput").disabled = true;
  }

  onReceived_chat(data) {
    // moved to ChatDataMessage onReceived
    Sounds.shared().playReceiveBeep();
    GroupChatColumn.shared().addChatMessage(
      data.type,
      data.message,
      data.nickname,
      data.id
    );
  }

  onReceived_prompt(data) {
    AiChatColumn.shared().guestAddPrompt(data);
  }

  onReceived_aiResponse(json) {
    AiChatColumn.shared().guestAddHostAIResponse(json);
  }

  onReceived_updateAiResponse(json) {
    AiChatColumn.shared().updateAIResponseJson(json) 
  }

  onReceived_ban(data) {
    //this.hostConnection().shutdown();
    GroupChatColumn.shared().addChatMessage(
      "chat",
      "You have been banned from the session.",
      "System",
      data.id
    );
    document.getElementById("chatInput").disabled = true;
  }

  onReceived_sessionHistory(data) {
    console.log("Received session history:", data.history);
  
    // Update guest list
    console.log("Received guestUserList:", data.guestUserList);
  
    PlayersColumn.shared().setGuestUserList(data.guestUserList);
    AiChatColumn.shared().guestDisplayHostSessionHistory(data.history);
  }  

  onReceived_updateImageProgress(data) {
    AiChatColumn.shared().updateImageProgressJson(data);
  }

  onReceived_systemMessage(data) {
    AiChatColumn.shared().guestAddSystemMessage(data);
  }

  onReceived_imageLink(data) {
    AiChatColumn.shared().addImage(data.message, data.requestId);
  }

  onReceived_gameLaunch(data) {
    AiChatColumn.shared().addMessage("prompt", data.message, data.nickname, data.id);
  }

  onReceived_updateTheme(data) {
    App.shared().applyThemeDict(data.json);
  }


  onReceived_grantAiAccess(data) {
    AiChatColumn.shared().setHasPromptAccess(true);
    GroupChatColumn.shared().addChatMessage(
      "chat",
      "You've been granted AI access!",
      "Host",
      data.id
    );
  }

  onReceived_revokeAiAccess(data) {
    AiChatColumn.shared().setHasPromptAccess(false);
    GroupChatColumn.shared().addChatMessage(
      "chat",
      "You've lost AI access.",
      "Host",
      data.id
    );
  }

  // --- send messages ---

  send(json) {
    this.hostConnection().send(json)
  }

  sharePlayer () {
    this.send({
      type: "updatePlayer",
      player: this.player().asJson()
    });
  }

  onReceived_updatePlayers(data) {
    if (Session.shared().players().subnodes().length === 0) {
      this.sharePlayer();
    }
    Session.shared().players().setJson(data.players);
    PlayersColumn.shared().display();
  }

  sendChat(message) {
    this.send({
      type: "chat",
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
      message: message,
    });
  }

}).initThisClass();
