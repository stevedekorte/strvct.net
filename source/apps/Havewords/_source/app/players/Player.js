"use strict";

/* 

    Player

      nickname
      id
      avatar

      LocalUser ref?
      PeerConnection ref?
      
*/

(class Player extends Base {
  initPrototypeSlots() {
    this.newSlot("info", null);
    this.newSlot("imageGenJob", null);
    //this.newSlot("localUser", null);
    //this.newSlot("guestConnection", null);
  }

  init() {
    super.init();
    this.setInfo({})
  }

  isLocal () {
    return this.id() === LocalUser.shared().id();
  }

  setJson(json) {
    this.setInfo(json);
    return this;
  }

  asJson () {
    return this.info();
  }

  // id

  id () {
    return this.info().id;
  }

  setId (v) {
    this.info().id = v;
    return this;
  }

  // nickname

  nickname () {
    return this.info().nickname;
  }

  setNickname (v) {
    this.info().nickname = v;
    if (this.info().data) {
      this.info().data.name = v;
    }
    return this;
  }

  // avatar

  avatar () {
    return this.info().avatar;
  }

  setAvatar (v) {
    this.info().avatar = v;
    if (this.isLocal()) {
      LocalUser.shared().setAvatar(v);
    }
    return this;
  }

  // canSendPrompts

  canSendPrompts () {
    return this.info()._canSendPrompts
  }

  setCanSendPrompts(v) {
    this.info()._canSendPrompts = v;
    return this;
  }

  // data

  data () {
    return this.info().data;
  }

  setData (v) {
    const oldAppearance = this.appearance();

    this.info().data = v;
    if (this.isLocal()) {
      LocalUser.shared().setData(v);
    }

    if (this.appearance() !== oldAppearance) {
      console.log("'" + this.appearance() + "' != '" + oldAppearance + "' so generating new avatar");
      this.generateImageFromAppearance();
    }
    
    return this;
  }

  appearance () {
    return this.info().data ? this.info().data.appearance : undefined;
  }

  processSceneSummary (text) {
    const s = this.appearance();
    if (s) {
      text.replaceAll(this.nickname(), "(" + s + ")")
    }
    text.replaceAll(" thick ", " heavy "); // hack
    return text;
  }

  isGeneratingImage() {
    return this.imageGenJob() !== null;
  }

  async generateImageFromAppearance() {
    if (this.appearance()) {
      assert(App.shared().isHost());
      const imagePrompt = SessionOptionsView.shared().artPromptPrefix() + " " + this.appearance() + ". " + SessionOptionsView.shared().artPromptSuffix();
      const job = MJImageJobs.shared().newJob();
      job.setPrompt(imagePrompt);
      job.setRequestId("player_" + this.id());
      this.setImageGenJob(job);

      let imageUrl;

      try { 
        imageUrl = await job.start();

        if (imageUrl) {
          this.setAvatar(imageUrl);
        }
      } catch(error) {
        console.warn(error);
      }
      App.shared().session().players().onChange()
      this.setImageGenJob(null);
      return imageUrl;
    }
  }

  /*
  async generateImageFromAppearance_new () {
    if (this.hasRequestedImage()) {
      console.warn("attempt to request image twice");
      return;
    }
    this.hideImageGenButton();
    this.setImageUrl(null); // to add loading animation

    const job = ImageBotJobs.shared().newJob();

    if (this.sceneSummary()) {
      // if the content of the page contains a summary tag, 
      // we use that so we can skip generating a summary from the full text
      job.setSceneSummary(this.sceneSummary());
    } else {
      job.setSceneDescription(this.text());
    }

    job.setRequestId(this.requestId());
    this.setImageJob(job);

    try {
      await job.start();
    } catch (error) {
      this.setErrorMessage(error.message);
    }
  }
  */

  setupCharacterSheet () {
    this.setData({
      name: this.nickname(),
      alignment: "",
      gender: "",
      race: "",
      class: "",
      level: 5,
    });
    return this;
  }

  share () {
    if (!App.shared().isHost()) {
      GuestSession.shared().sharePlayer();
    }
  }

}.initThisClass());

