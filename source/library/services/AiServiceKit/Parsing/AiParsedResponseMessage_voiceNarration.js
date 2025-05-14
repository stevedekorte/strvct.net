"use strict";

/*

    AiParsedResponseMessage_voiceNarration

*/

(class AiParsedResponseMessage_voiceNarration extends AiParsedResponseMessage {

  /*
  initPrototypeSlots () {
    //voice narration
    {
      const slot = ≈.newSlot("isDoneSpeaking", false);
      slot.setCanInspect(true);
      slot.setDuplicateOp("duplicate");
      slot.setInspectorPath(this.type());
      slot.setLabel("Is Done Speaking");
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true);
      slot.setSlotType("Boolean");
      slot.setIsSubnodeField(false);      
    }
  }
    */

  didUpdateIsDoneSpeaking (oldValue, newValue) {
    if (newValue) {
      //this.clearAnyQueuedAudio();
    }
  }

  tagsToSpeak () {
    return ["sentence", "location-name", "session-name"];
  }

  // --- voice narration ---

  playTtsPauseMs (ms) {
    assert(Type.isNumber(ms));
    this.voiceNarrateText(`<break time="` + ms + `ms"/>`);
  }

  shouldVoiceNarrate () {
    const session = this.session();
    if (session && session.settings) {
      const settings = session.settings();
      const voiceNarrationOn = settings.shouldVoiceNarrate();
      return !this.isDoneSpeaking() && this.session().isHost() && voiceNarrationOn;
    }
    return false;
  }

  stopSpeaking () {
    this.setIsDoneSpeaking(true);
    this.speaker().stopAndClearQueue();
    return this;
  }

  session () {
    return this.conversation().firstOwnerChainNodeOfClass(HwSession);
  }

  speaker () {
    const settings = this.session().settings();
    const speaker = settings.narrationSpeaker();
    return speaker;
  }

  voiceNarrateText (text) {
    const speaker = this.speaker();
    speaker.setPrompt(text);
    //speaker.setPrompt(this.spokenContentOfText(text));
    const sound = speaker.generate(); // this will add it to the speaker's tts queue, and then audio queue
    // we want to follow when the sound starts/stops playing so we can highlight/unhighlight the text
    sound.addDelegate(this);
    sound.setTranscript(text); // so we know which text audio is for when handling the delegate methods
  }

  onSoundStarted (sound) {
    //console.log(this.type() + ".onSoundStarted [" + sound.transcript().clipWithEllipsis(15) + "]");
    this.onSpeakingText(sound.transcript());

    //debugger;
    if (this.session().isHost() /*&& this.session().hasClients() */) {
      const audioMsg = HwAudioMessage.clone()
        .setInReplyToMessageId(this.messageId())
        .setSound(sound);
      audioMsg.promisePrepareDataUrl().then(() => {
        this.session().shareAudioMessage(audioMsg);
      });
    }
  }

  onSpeakingText (text) {
    this.postNoteNamed("onSpeakingText").setInfo(text); //.setIsDebugging(true);
  }

  onSoundEnded (sound) {
    //console.log(this.type() + ".onSoundEnded [" + sound.transcript().clipWithEllipsis(15) + "]");
    this.onSpokeText(sound.transcript());
  }

  onSpokeText (text) {
    this.postNoteNamed("onSpokeText").setInfo(text); //.setIsDebugging(true);
  }

  /*
  onSoundStarted (aNote) {
    const sound = aNote.sender();
    this.postNoteNamed("onSpeakingText").setInfo(sound.transcript());
  }

  onSoundEnded (aNote) {
    const sound = aNote.sender();
    this.postNoteNamed("onSpokeText").setInfo(sound.transcript());
  }
  */

  /*
  spokenContentOfText (text) {
    return text.stripHtmlElementsWithTagNames(this.unspeakableTagNames());
  }
  */

}).initThisCategory();


