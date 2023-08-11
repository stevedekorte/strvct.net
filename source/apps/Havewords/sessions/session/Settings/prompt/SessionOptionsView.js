"use strict";

/* 
    SessionOptionsView

*/

(class SessionOptionsView extends View {
  initPrototypeSlots() {
    this.newSlot("imageGenModelOptions", null);
  
  }

  init() {
    super.init();
  }


  // --- helpers ---

  sessionType() {
    return this.sessionTypeOptions().selectedValue();
  }

  sessionSubtype() {
    return this.sessionSubtypeOptions().selectedValue();
  }

  sessionSubtype2() {
    if (this.sessionSubtype2Options().selectedIndex() === 0) {
      return `Before we begin playing, I would like you to provide my three adventure options. 
Each should be a short description of the kind of adventure we will play, and what the tone of the adventure will be. 
Once I decide on the adventure, you may provide a brief setting description and begin the game.`;
    }

    const option = this.sessionSubtype2Options().selectedValue();
    return "Please make the adventure a campaign using the DnD \"" + option + "\" module.";
  }

  playerNames() {
    return App.shared().session().players().subnodes().map(player => player.nickname()).join(", ");
  }

  playerCharacterSheets () {
    const sheets = App.shared().session().players().subnodes().map(player => player.data());
    return JSON.stringify(sheets);
  }

  replacedConfigString(s) {
    s = s.replaceAll("[sessionType]", this.sessionType());
    s = s.replaceAll("[sessionSubtype]", this.sessionSubtype());
    s = s.replaceAll("[sessionSubtype2]", this.sessionSubtype2());
    s = s.replaceAll("[playerNames]", this.playerNames());
    if (s.indexOf("[playerCharacterSheets]") !== -1) {
      s = s.replaceAll("[playerCharacterSheets]", this.playerCharacterSheets());
    }
    s = s.replaceAll(
      "[customization]",
      this.sessionCustomizationText().string()
    );
    return s;
  }

  // --- config lookups ---

  getPathOnJson (path, json) {
    const parts = path.split(".");
    let v = json;
    let k = parts.shift();
    while (v && k) {
      v = v[k];
      k = parts.shift();
    }
    return v;
  }

  typeConfigLookup (path) {
    const json = this.sessionTypeOptions().selectedElement()._item;
    return this.getPathOnJson(path, json);
  }

  subtypeConfigLookup (path) {
    const json = this.sessionSubtypeOptions().selectedElement()._item;
    return this.getPathOnJson(path, json);
  }

  configLookup (key) {
    const a = this.typeConfigLookup(key);
    const b = this.subtypeConfigLookup(key);
    const v = b ? b : a;
    return v ? v : "";
  }

  addativeConfigLookup (key) {
    const a = this.typeConfigLookup(key);
    const b = this.subtypeConfigLookup(key);
    let A = a ? a : "";
    let B = b ? b : "";
    return A + B;
  }

  prompt () {
    const fullPrompt = [
      this.configLookup("promptPrefix"),
      this.configLookup("prompt"),
      this.configLookup("promptSuffix"),
      this.languagePrompt(),
    ].join("\n\n");

    return this.replacedConfigString(fullPrompt);
  }

  message() {
    const v = this.configLookup("message");
    return this.replacedConfigString(v);
  }

  // --- art prompt ---

  artPromptSuffix() {
    const v = this.configLookup("artPromptSuffix");
    return this.replacedConfigString(v);
  }

  artPromptPrefix() {
    const v = this.configLookup("artPromptPrefix");
    return this.replacedConfigString(v);
  }

  // -- music playlist ---

  musicPlaylists() {
    return this.configLookup("musicPlaylists");
  }

  // -- theme properties ---

  sessionBackgroundColor() {
    const v = this.configLookup("theme.backgroundColor");
    return v ? v : "#222";
  }

  sessionTextColor() {
    const v = this.configLookup("theme.color");
    return v ? v : "rgb(219, 219, 219)";
  }

  sessionFontFamily() {
    return this.configLookup("theme.fontFamily");
  }

  sessionFontWeight() {
    const v = this.configLookup("theme.fontWeight");
    return v ? v : "300";
  }

  headerFontFamily() {
    const v = this.configLookup("theme.headerFontFamily");
    return v ? v : "inherit";
  }


  headerTextTransform() {
    const v = this.configLookup("theme.headerTextTransform");
    return v ? v : "inherit";
  }

  // ----------------------------------

  allowsImageGen() {
    if (!ImageGenOptions.shared().allowsImageGen()) {
      return false;
    }

    const v = this.configLookup("allowsImageGen");
    return v ? v : true;
  }

  // --- start session ---

  themePrefsJson() {
    return {
      bookTitle: { 
        "font-family": this.headerFontFamily(),
      },

      chapterNumber: { 
        "font-family": this.headerFontFamily(),
        "letter-spacing": this.configLookup("theme.chapterNumberLetterSpacing"),
      },

      chapterTitle: { 
        "font-family": this.headerFontFamily(),
        "text-transform": this.headerFontFamily(),
        "letter-spacing": this.configLookup("theme.chapterTitleLetterSpacing"),
      },

      "drop-cap": { 
        "font-family": this.headerFontFamily(),
      },

      AiChatMessages: {
        "font-family": this.sessionFontFamily(),
        "font-weight": this.sessionFontWeight(),
      },

      body: {
        "background-color": this.sessionBackgroundColor(),
        color: this.sessionTextColor(),
      },
    };
  }

  applyCSSPrefs() {
    const dict = this.themePrefsJson();
    App.shared().applyThemeDict(dict);
  }

  sessionTitle() {
    return (
      this.sessionTypeOptions().selectedLabel() +
      " / " +
      this.sessionSubtypeOptions().selectedLabel()
    );
  }

  async onSubmit_sessionStartButton() {
    this.hide();
    this.sessionResetButton().unhide();

    HostSession.shared().shareThemeWithGuests()

    MusicPlayer.shared().selectPlaylistsWithNames(this.musicPlaylists());
    const defaultMusicTrackId = this.configLookup("defaultMusicTrackId");
    if (defaultMusicTrackId) {
      HostSession.shared().playTrackId(defaultMusicTrackId);
    }

    this.applyCSSPrefs();
    this.updateSessionTitle();

    Session.shared().setGameMode(
      this.sessionTypeOptions().selectedElement()._item.gameMode
    );

    // Send the system message and the prompt to the AI
    // Send a message to all connected guests
    HostSession.shared().broadcast({
      type: "gameLaunch",
      id: LocalUser.shared().id(),
      message: this.message(),
      nickname: LocalUser.shared().nickname(),
      sessionType: this.sessionType(),
    });

    Sounds.shared().playOminousSound();

    console.log("--- BEGIN SYSTEM PROMPT ---");
    console.log(this.prompt());
    console.log("--- END SYSTEM PROMPT ---");
    HostSession.shared().sendAIResponse(this.prompt(), "system");
  }
}).initThisClass();
