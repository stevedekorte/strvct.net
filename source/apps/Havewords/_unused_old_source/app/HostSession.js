"use strict";

/* 
    HostSession

    PeerJS webRTC code

*/

(class HostSession extends Base {
  initPrototypeSlots() {
    this.newSlot("bannedGuests", null);
    this.newSlot("hasSetup", false);
  }

  init() {
    super.init();
    this.setBannedGuests(new Set());
    this.setIsDebugging(true);

    assert(App.shared().isHost()); // Guest sessions should never access this class
  }

  async broadcast(json) {
    //await LocalUser.shared().cryptoId().signJson(json);
    PeerServer.shared().broadcast(json);
  }

  broadcastExceptTo(json, excludeId) {
    PeerServer.shared().broadcastExceptTo(json, excludeId);
  }

  playTrackId (trackId) {
    MusicPlayer.shared().playTrackId(trackId);
    this.broadcastPlayTrackId(trackId);
  }

  broadcastPlayTrackId (trackId) {
    this.broadcast({
      type: "playTrackId",
      trackId: trackId,
    });
  }

  async broadcastPlayAudioBlob (audioBlob) {
    const dataUrl = await audioBlob.asyncToDataUrl();
    this.broadcast({
      type: "playAudioBlob",
      //id: LocalUser.shared().id(),
      //nickname: LocalUser.shared().nickname(),
      audioBlobDataUrl: dataUrl,
    });
  }

  // --- user actions ---

  kickUser(userId) {
    console.log("Kicked guest: " + userId);
    const pc = PeerServer.shared().peerConnectionForId(userId);
    if (pc) {
      pc.sendThenClose({ type: "kick" });
    }
    this.sendSystemMessage(userId + " was kicked")
  }

  banUser(userId) {
    console.log("Banned guest: " + userId);
    this.bannedGuests().add(userId);

    const pc = PeerServer.shared().peerConnectionForId(userId);
    
    if (pc) {
      pc.sendThenClose({ type: "ban" });
    }
    this.sendSystemMessage(pc.nickname() + " was banned")
  }
  
  closeConnectionForUser(userId) {
    const pc = PeerServer.shared().peerConnectionForId(userId);
    if (pc) {
      pc.shutdown()
    }
  }

  // --- peer setup ---

  setupInviteButton() {
    const inviteLink = App.shared().inviteLink();
    InviteButton.shared().setLink(inviteLink).unhide();
  }

  setupHostSession() {
    if (this.hasSetup()) {
      // might get called again if we reconnect to PeerServer
      return
    }
    this.setHasSetup(true);

    assert(App.shared().isHost())

    //console.log("Setting up host session");
    this.setupInviteButton();

    Session.shared().clear()
    //App.shared().session().players().addLocalPlayer();

    AiChatColumn.shared().displaySessionHistory();
   //GroupChatColumn.shared().displayHostHTMLChanges();

    OpenAiChat.shared().clearConversationHistory();

    /* TODO: this was being added 2x in the D&D session. Is it needed in other contexts?
    OpenAiChat.shared().addToConversation({
      role: "system",
      content: "You are a helpful assistant.",
    });
    */

    this.updateGuestUserlist();
  }

  onOpenGuestConnection (aGuestConnection) {
    this.shareThemeWithGuests();
  }

  sharePlayers () {
    const json = App.shared().session().players().asJson();
    this.broadcast({
      type: "updatePlayers",
      players: json,
    });
    return this;
  }

  shareThemeWithGuests () {
    this.broadcast({
      type: "updateTheme",
      json: SessionOptionsView.shared().themePrefsJson()
    });
  }

  updateGuestUserlist() {
    PlayersColumn.shared().syncFromNode();
  }

  // ---------------------

  guestChangeSystemMessage(data) {
    const content = data.message;
    OpenAiChat.shared().addToConversation({
      role: "user",
      content: prompt,
    });

    // Relay to connected guests
    this.broadcast({
      type: "systemMessage",
      id: data.id,
      message: data.message,
      nickname: data.nickname,
    });
  }

  // Send imageURL to all connected guests
  broadcastImage(imageURL, requestId) {
    Session.shared().addToHistory({
      type: "imageLink",
      data: imageURL,
      requestId: requestId,
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
    });

    this.broadcast({
      type: "imageLink",
      message: imageURL,
      requestId: requestId,
      nickname: LocalUser.shared().nickname(),
    });
  }

  sendPrompt(message) {
    this.broadcast({
      type: "prompt",
      id: LocalUser.shared().id(),
      message: message,
      nickname: LocalUser.shared().nickname(),
    });

    if (Session.shared().gameMode()) {
      message = LocalUser.shared().nickname() + ": " + message;
      console.log("Game mode on, host adds username to prompt");
    }
    this.sendAIResponse(message);
  }

  sendSystemMessage(message) {
    this.broadcast({
      type: "systemMessage",
      id: LocalUser.shared().id(),
      message: message,
      nickname: LocalUser.shared().nickname(),
    });
  }

  async sendAIResponse(prompt, role = "user") {
    // Get AI Response and post locally
    const request = await OpenAiChat.shared().newRequestForPrompt(prompt, role);
    request.setStreamTarget(this);

    AiChatColumn.shared().addAIReponse("", request.requestId());

    this.broadcast({
      type: "aiResponse",
      id: LocalUser.shared().id(),
      requestId: request.requestId(),
      message: "",
      nickname: SessionOptionsView.shared().selectedModelNickname(),
    });

    this.shareUpdate(request, "");

    return await request.asyncSendAndStreamResponse();
  }

  usableStringFromString(s) {
    //indexOfEndOfLastFullWordOnString
    let l = s.length - 1;
    while (l) {
      const c = s.substr(l, 1);
      if ([" ", ".", "\n"].indexOf(c) !== -1) {
        break;
      }
      l --;
    }
    return s.substr(0, l);
  }

  onStreamData (request, newData) {
    //debugger;
    //console.log("Host " + request.requestId() + " onStreamData:" , newData);
    let content = request.fullContent();
    /*
    if (!content.isValidHtml()) { 
      content += "</div>"; 
    }
    */


    if (content.isValidHtml()) {
      const usableString = this.usableStringFromString(content);
      //console.log("usableString [" + usableString + "]");

      const lastContent = request.lastContent();
      const newContent = usableString.substr(lastContent.length);
      if (newContent.length) {
        const wrappedNewContent = newContent.wrapHtmlWordsWithSpanClass("fadeInWord");
        //console.log("---\n" + wrappedNewContent + "\n---");
        const sendContent = lastContent + wrappedNewContent;
        request.setLastContent(usableString);
        this.shareUpdate(request, sendContent);
      }
    }
  }

  shareUpdate (request, sendContent, isDone=false) {
    const json = {
      type: "updateAiResponse",
      id: LocalUser.shared().id(),
      requestId: request.requestId(),
      message: sendContent,
      isDone: isDone
    };
    AiChatColumn.shared().updateAIResponseJson(json)
    this.broadcast(json);
  }

  onStreamComplete (request) {
    //debugger
    const content = request.fullContent();
    this.shareUpdate(request, content, true);
    AiChatColumn.shared().onAiResponseCompleteText(content, request.requestId());
    console.log("Host " + request.requestId() + " onStreamComplete");
  }

  updateImageProgress(aJob) { 
    //console.log(this.type() + ` MJImageGenProgress status: ${imageGen.status()} progress: ${ imageGen.progress()}`);
    const json = {
      type: "updateImageProgress",
      id: LocalUser.shared().id(),
      requestId: aJob.requestId(),
      percentage: aJob.progress(),
      timeTaken: aJob.timeTaken(),
      status: aJob.status(),
      errorMessage: aJob.errorMessage()
    };

    AiChatColumn.shared().updateImageProgressJson(json);
    this.broadcast(json);
  }
  
}).initThisClass();
