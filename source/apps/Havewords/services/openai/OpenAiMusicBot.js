"use strict";

/* 
    

*/

(class OpenAiMusicBot extends BMStorableNode {
  initPrototypeSlots() {
    this.newSlot("sceneDescription", null);
    this.newSlot("lastMusicChoice", null);
  }

  init() {
    super.init();
    this.setIsDebugging(false);
  }

  newRequest() {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    return request;
  }

  // ImageBot function it triggered when the host requests an image description of the current scene
  async trigger() {
    if (MusicPlayer.shared().isMuted()) {
      this.debugLog("played is muted so not triggering");
      return this;
    }

    assert(this.sceneDescription());
    assert(this.apiKey());

    const request = this.newRequest().setBodyJson({
      model: SessionOptionsView.shared().aiModel(), //"gpt-3.5-turbo",
      messages: [{ 
        role: "user", 
        content: this.prompt() 
      }]
    });
    this.debugLog("music bot prompt: '" + this.prompt()  + "'");

    const data = await request.asyncSend();
    if (data.error) {
      throw new Error(data.error);
    }

    const response = data.choices[0].message.content;
    this.debugLog("music bot response: '" + response + "'");
    // Only update the music if the response is different from the last choice
    if (response !== this.lastMusicChoice()) {
      this.setLastMusicChoice(response);
      this.handlePromptResponse(response);
    } else { 
      this.debugLog("music bot response is the same as last choice, ignoring");
    }
      
    //HostSession.shared().broadcastMusic(MusicPlayer.shared().trackId());
  }

  prompt () {
    assert(this.sceneDescription());
    let s = "Given this scene description:\n"
    s += "[[" + this.sceneDescription() + "]]\n";

    // Add the last chosen track to the prompt
    if (this.lastMusicChoice()) {
      s += "The current music playing is \"" + this.lastMusicChoice() + "\".\n";
    }
    s += "Which one of the following music tracks do you feel would be most appropriate for that scene:";
    s += MusicPlayer.shared().trackNames().map(s => '"' + s + '"').join(",");

    // Instruct the AI to maintain the current music if it still fits the scene
    if (this.lastMusicChoice()) {
      s += "\nIf you think the current music \"" + this.lastMusicChoice() + "\" still fits the scene, please respond with the same track name. If you're unsure about whether or not the music still fits, please respond with the same track name anyway. ";
    }
    s += "\nPlease only respond with the track name you chose in double quotes and only suggest a track name from the list provided."
    return s;
  }

  handlePromptResponse(s) {
    this.debugLog("handlePromptResponse('" + s + "'");
    if (s.startsWith("\"") && s.endsWith("\"")) {
      const trackName = s.slice(1, -1); // remove the quotes
      const trackId = MusicPlayer.shared().trackIdForName(trackName);
      HostSession.shared().playTrackId(trackId)
    } else {
      this.debugLog("ERROR: response not in valid quoted format");
    }
    return this;
  }

}).initThisClass();
