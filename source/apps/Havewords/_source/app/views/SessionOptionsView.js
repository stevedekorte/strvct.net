"use strict";

/* 
    SessionOptionsView

*/

(class SessionOptionsView extends View {
  initPrototypeSlots() {
    // ai service
    this.newSlot("apiKeyText", null);
    this.newSlot("aiModelOptions", null);

    // text to speech service for naration
    this.newSlot("azureApiKeyText", null);
    this.newSlot("azureApiRegionOptions", null);

    // image gen service
    this.newSlot("imageGenModelOptions", null);
    this.newSlot("midjourneyApiKeyText", null);
    this.newSlot("midjourneyApiBaseUrlText", null);

    // session options
    this.newSlot("sessionTypeOptions", null);
    this.newSlot("sessionSubtypeOptions", null);
    this.newSlot("sessionSubtype2Options", null);
    this.newSlot("sessionDescription", null);
    this.newSlot("sessionCustomizationText", null);
    this.newSlot("sessionLanguageOptions", null);

    this.newSlot("sessionStartButton", null);
    this.newSlot("sessionResetButton", null);
  }

  init() {
    super.init();
    this.setId("aiSelectionBlock");

    assert(App.shared().isHost());

    this.setAiModelOptions(
      OptionsView.clone().setId("aiModelOptions").setTarget(this)
    );
    this.asyncSetupAiModelOptions();

    this.setupApiKeyText();
    this.setupAzureApiKeyText();
    this.setupAzureApiRegionOptions();

    this.setImageGenModelOptions(
      OptionsView.clone()
        .setId("imageGenModelOptions")
        .setTarget(this)
        .setOptions(
          ImageGenOptions.shared()
            .modelOptions()
            .map((name) => {
              return { label: name, value: name };
            })
        )
    );

    this.setupImageGenModelOptions();
    this.setupMidjourneyApiKeyText();
    this.setupMidjourneyApiBaseUrlText();

    this.setSessionTypeOptions(
      OptionsView.clone()
        .setId("sessionTypeOptions")
        .setTarget(this)
        .setOptions(sessionOptionsArray)
        .setShouldStore(true)
        .load()
    );

    this.setSessionSubtypeOptions(
      OptionsView.clone().setId("sessionSubtypeOptions").setTarget(this).setShouldStore(true).load()
    );

    this.setSessionSubtype2Options(
      OptionsView.clone().setId("sessionSubtype2Options").setTarget(this).setShouldStore(true).load().hide()
    );

    //debugger;
    this.setSessionDescription(TextAreaInputView.clone().setId("sessionDescription").hide());

    this.sessionTypeOptions().submit(); // to setup subtypes

    this.sessionSubtypeOptions().setShouldStore(true).load();

    this.setSessionLanguageOptions(
      OptionsView.clone()
        .setId("sessionLanguageOptions")
        .setTarget(this)
        .setOptions(AzureTextToSpeech.shared().languageOptions())
        .setShouldStore(true)
        .load()
    );

    if (!this.sessionLanguageOptions().hasSelection()) {
      // make US English the default
      this.sessionLanguageOptions().setSelectedLabel("English (United States)");
    }

    this.setSessionCustomizationText(
      TextAreaInputView.clone()
        .setId("sessionCustomizationText")
        .setTarget(this)
    );

    this.setSessionStartButton(
      Button.clone()
        .setId("sessionStartButton")
        .setTarget(this)
        .setIsDisabled(true)
    );

    this.setSessionResetButton(
      Button.clone().setId("SessionResetButton").setTarget(this)
    );

    this.sessionResetButton().setIsHidden(!App.shared().isHost());

    //this.setupApiKeyText();


    this.onSubmit_sessionSubtypeOptions()
    this.onSubmit_sessionSubtype2Options()

    this.onUpdateInputs(); // to enable start button if ready
  }

  async asyncSetupAiModelOptions() {
    const note = document.getElementById("AiModelOptionsNote");
    await OpenAiChat.shared().asyncCheckModelsAvailability();
    let names = OpenAiChat.shared().availableModelNames();

    // Get the API key
    let apiKey = OpenAiChat.shared().apiKey();

    // Change the note's display, opacity and color only if there's an API key
    if (apiKey && (!names || names.length === 0)) {
      note.style.display = "inline";
      note.style.opacity = 1;
      note.style.color = "yellow";
    }

    //debugger;
    await OpenAiChat.shared().asyncCheckModelsAvailability();
    names = OpenAiChat.shared().availableModelNames();
    //this.debugLog("available model names:", names);
    this.aiModelOptions().setOptions(names).setShouldStore(true).load();
    this.onUpdateInputs();

    // If there is an API key, hide the note again
    if (apiKey) {
      note.style.opacity = 0;
    }
  }

  languagePrompt() {
    const label = this.sessionLanguageOptions().selectedLabel();
    const value = this.sessionLanguageOptions().selectedValue();
    AzureTextToSpeech.shared().setVoiceName(value);

    const parts = label.split("(");
    const locale = parts[0];
    let prompt = `Please make all your responses in the ${locale} language`;
    if (parts.length > 1) {
      const subLocale = parts[1].split(")")[0];
      prompt += `, as spoken in ${subLocale}.`;
    }
    //console.log("============== language prompt:", prompt);
    return prompt;
  }

  setupApiKeyText() {
    const field = TextFieldView.clone().setId("apiKeyText").setTarget(this);
    this.setApiKeyText(field);

    field.setValidationFunc((s) => {
      const isValid = OpenAiService.shared().validateKey(s);
      if (isValid) {
        if (s !== OpenAiService.shared().apiKey()) {
          OpenAiService.shared().setApiKey(s);
          this.asyncSetupAiModelOptions();
        }
      } else {
        OpenAiService.shared().setApiKey(null);
        this.aiModelOptions().setOptions([]);
      }
      return isValid;
    });

    // Load the stored API key
    const k = OpenAiChat.shared().apiKey();
    if (k) {
      field.setString(k);
    }
  }

  setupAzureApiKeyText() {
    //debugger;
    const field = TextFieldView.clone().setId("azureApiKeyText");
    this.setAzureApiKeyText(field);

    field.setValidationFunc((s) => {
      //  debugger;
      const isValid = AzureService.shared().validateKey(s);
      if (isValid) {
        AzureService.shared().setApiKey(s);
      } else {
        AzureService.shared().setApiKey(null);
      }
      return isValid;
    });

    // Load the stored API key
    const k = AzureService.shared().apiKey();
    if (k) {
      field.setString(k);
    }
  }

  onKeyUp_apiKeyText() {
    this.onUpdateInputs();
  }

  canStart() {
    if (
      ImageGenOptions.shared().isMidjourneyOption() &&
      (!this.midjourneyApiKeyText().isValid() ||
        !this.midjourneyApiBaseUrlText().isValid())
    ) {
      return false;
    }

    return this.apiKeyText().isValid() && this.aiModelOptions().selectedValue();
  }

  onUpdateInputs() {
    this.sessionStartButton().setIsDisabled(!this.canStart());
  }

  setupAzureApiRegionOptions() {
    const options = OptionsView.clone()
      .setId("azureApiRegionOptions")
      .setOptions(AzureService.shared().regionOptions())
      .setTarget();
    this.setAzureApiRegionOptions(options);

    // Load the stored API key
    const s = AzureService.shared().region();
    if (s) {
      options.setSelectedValue(s);
    }
  }

  onSubmit_azureApiRegionOptions() {
    AzureService.shared().setRegion(
      this.azureApiRegionOptions().selectedValue()
    );
  }

  setupImageGenModelOptions() {
    this.imageGenModelOptions().setSelectedLabel(
      ImageGenOptions.shared().option()
    );
  }

  setupMidjourneyApiKeyText() {
    const field = TextFieldView.clone()
      .setId("midjourneyApiKeyText")
      .setTarget(this)
      .setShouldStore(true)
      .load()
    this.setMidjourneyApiKeyText(field);

    const self = this;

    field.setValidationFunc((s) => {
      const isValid = MJService.shared().validateKey(s);
      if (isValid) {
        MJService.shared().setApiKey(s);
      }
      return isValid;
    });

    // Load the stored API key
    const s = MJService.shared().apiKey();
    if (s) {
      field.setString(s);
    }

    this.showMidjourneyFieldsIfNeeded();
  }

  onChange_midjourneyApiKeyText() {
    console.log("onChange_midjourneyApiKeyText");
    this.onUpdateInputs();
  }

  setupMidjourneyApiBaseUrlText() {
    const field = TextFieldView.clone()
      .setId("midjourneyApiBaseUrlText")
      .setTarget(this);
    this.setMidjourneyApiBaseUrlText(field);

    const self = this;
    field.setValidationFunc((s) => {
      const isValid = MJService.shared().validateBaseUrl(s);
      if (isValid) {
        MJService.shared().setApiBaseUrl(s);
      }
      return isValid;
    });

    // Load the stored API key
    const s = MJService.shared().apiBaseUrl();
    if (s) {
      field.setString(s);
    }

    this.showMidjourneyFieldsIfNeeded();
  }

  onChange_midjourneyApiBaseUrlText() {
    console.log("onChange_midjourneyApiBaseUrlText");
    this.onUpdateInputs();
  }

  showMidjourneyFieldsIfNeeded() {
    if (ImageGenOptions.shared().isMidjourneyOption()) {
      document.getElementById("midjourneyApiKeyContainer").style.display =
        "block";
      document.getElementById("midjourneyApiBaseUrlContainer").style.display =
        "block";
      //ImageBotJobs.shared().setImageGen(MJImageJobs.shared());
    } else {
      document.getElementById("midjourneyApiKeyContainer").style.display = "none";
      document.getElementById("midjourneyApiBaseUrlContainer").style.display = "none";
      //ImageBotJobs.shared().setImageGen(OpenAiImageGen.shared());
    } 
  }

  // --- setup ---

  appDidInit() {
    //this.hidePromptInputs();

    if (App.shared().isHost()) {
      this.unhide();
    } else {
      this.hide();
    }
  }

  // --- aiModelOptions ---

  onSubmit_aiModelOptions() {}

  selectedModelNickname() {
    return this.aiModelOptions().selectedValue();
  }

  // --- sessionTypeOptions ---

  onSubmit_sessionTypeOptions() {
    const subOptionsArray =
      this.sessionTypeOptions().selectedElement()._item.options;
    this.sessionSubtypeOptions().setOptions(subOptionsArray);

    this.onSubmit_sessionSubtypeOptions();
  }

  onSubmit_imageGenModelOptions() {
    ImageGenOptions.shared().setOption(
      this.imageGenModelOptions().selectedValue()
    );
    this.showMidjourneyFieldsIfNeeded();
    this.onUpdateInputs();
  }

  // --- sessionSubtypeOptions ---

  onSubmit_sessionSubtypeOptions() {
    const options = this.sessionSubtypeOptions().selectedElement()._item.options;
    if (options) {
      this.sessionSubtype2Options().setOptions(options).unhide();
      this.onSubmit_sessionSubtype2Options();
    } else {
      this.sessionSubtype2Options().setOptions([]).hide();
      this.sessionDescription().hide();
    }
    this.onSubmit_sessionSubtype2Options();
  }

  onSubmit_sessionSubtype2Options() {
    const option = this.sessionSubtype2Options().selectedElement()
    const s = option ? option._item.description : "";
    this.sessionDescription().setString(s).setIsHidden(s === "");
  }

  /*
  hidePromptInputs() {
    document.getElementById("messageInputSection").style.display = "none";
  }
  */

  /*
  // You can call this function when the host starts a new session
  checkForExistingSession() {
    const sessionData = Session.shared().data();
    if (sessionData) {
      const userChoice = confirm(
        "Do you want to restore the previous session? Cancel to start a new session."
      );
      if (userChoice) {
      } else {
        // Start a new session
        Session.shared().clear();
      }
    }
  }
  */


  // --- helpers ---

  aiModel() {
    return this.aiModelOptions().selectedValue();
  }

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

  getPathOnJson(path, json) {
    const parts = path.split(".");
    let v = json;
    let k = parts.shift();
    while (v && k) {
      v = v[k];
      k = parts.shift();
    }
    return v;
  }

  typeConfigLookup(path) {
    const json = this.sessionTypeOptions().selectedElement()._item;
    return this.getPathOnJson(path, json);
  }

  subtypeConfigLookup(path) {
    const json = this.sessionSubtypeOptions().selectedElement()._item;
    return this.getPathOnJson(path, json);
  }

  configLookup(key) {
    const a = this.typeConfigLookup(key);
    const b = this.subtypeConfigLookup(key);
    const v = b ? b : a;
    return v ? v : "";
  }

  addativeConfigLookup(key) {
    const a = this.typeConfigLookup(key);
    const b = this.subtypeConfigLookup(key);
    let A = a ? a : "";
    let B = b ? b : "";
    return A + B;
  }

  prompt() {
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

  updateSessionTitle() {
    const e = document.getElementById("SessionTitle");
    e.innerHTML = this.sessionTitle();
  }

  onSubmit_SessionResetButton () {
    const r = confirm("Are you sure you want to reset the session? This will lose the current session state.");
    if (r === true) {
      this.resetSession();
    }
  }

  resetSession () {
    AiChatColumn.shared().clearMessages();
    Session.shared().clear();
    this.sessionResetButton().hide();
    this.unhide();
    HostSession.shared().broadcast({ 
      "type": "resetSession",
    });
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

    /*
    AiChatColumn.shared().addMessage(
      "prompt",
      "You've started the session!",
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
    */
    Session.shared().setInSession(true);

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

    /*
    const response = await OpenAiChat.shared().asyncFetch(this.prompt());

    // Stores initial AI response, which contains character descriptions, for later use
    //Session.shared().setGroupSessionFirstAIResponse(response);
    AiChatColumn.shared().addAIReponse(response);

    // Send the response to all connected guests
    HostSession.shared().broadcast({
      type: "aiResponse",
      id: LocalUser.shared().id(),
      message: response,
      nickname: this.selectedModelNickname(),
    });
    */
  }
}).initThisClass();
