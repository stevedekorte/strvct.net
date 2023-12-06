"use strict";

/* 
    AzureTtsRequest

*/

(class AzureTtsRequest extends BMStorableNode {
  initPrototypeSlots() {
    {
      const slot = this.newSlot("inputText", "");
      //slot.setInspectorPath("")
      //slot.setLabel("input text")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
      //slot.setValidValues(values)
    }

    {
      const slot = this.newSlot("startAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Start");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("start");
    }

    {
      const slot = this.newSlot("outputAudioBlob", null);
      //slot.setInspectorPath("")
      //slot.setLabel("output audio")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("AudioBlob");
      //slot.setIsSubnodeField(true)
    }

    {
      const slot = this.newSlot("error", null);
    }
  }

  initPrototype() {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.setCanAdd(true);
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled");
    this.setSubtitle("tts request");
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([]);
  }

  // --- helpers ---

  requests() {
    return this.parentNode();
  }

  service () {
    return this.speaker().service()
  }

  speaker () {
    return this.requests().speaker()
  }

  // --- text ---

  cleanText(text) {
    // make sure we don't lose the whitespace formatting as we need it for pacing
    text = text.replaceAll("<p>", "");
    text = text.replaceAll("</p>", "\n\n");
    text = text.replaceAll("<br>", "\n\n");
    //text = text.replaceAll(".", "\n\n");

    text = text.removedHtmlTags();

    text = text.replaceAll(" - ", "... "); // quick hack to get the pause length right for list items
    //text = text.replaceAll(".\n\n", "...\n\n"); // quick hack to get the pause length right for list items
    return text.trim();
  }

  cleanedText () {
    return this.cleanText(this.inputText());
  }

  // --- request details ---

  requestUrl () {
    return "https://" + this.speaker().service().region() + ".tts.speech.microsoft.com/cognitiveservices/v1";
  }

  requestOptions () {

  }

  canSpeak () {
    const hasKey = speaker.service().apiKey() !== null;
    const hasText = this.cleanedText().length > 0;
    return hasKey && hasText;
  }

  async start() {
    const speaker = this.speaker();
    const text = this.cleanedText();

    if (text.length === 0) {
      const errorMsg = this.type() + " requested tts on empty string"
      this.updateSubtitle("ERROR: empty text");
      this.setError(errorMsg)
      console.warn(errorMsg)
      return Promise.resolve()
    }

    this.updateSubtitle("sending request");

    const ssml = speaker.ssmlRequestForText(text);
    this.debugLog("start(" + text + ")");

    //this.debugLog("made request")
    const response = await fetch(
      this.requestUrl(),
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speaker.service().apiKey(),
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
        },
        body: ssml,
      }
    );
    console.log("SSML: [[\n" + ssml + "\n]]");
    this.updateSubtitle("awaiting response");

    if (!response.ok) {
      const codeString = HttpResponseCodes.shared().shortStringForCode(response.status);
      this.updateSubtitle(codeString);
      //throw new Error("HTTP error! status: " + codeString);
      return 
    }

    this.updateSubtitle("completed");

    const audioBlob = await response.blob();
    // need to call asyncPrepareToStoreSynchronously as OutputAudioBlob slot is stored,
    // and all writes to the store tx need to be sync so the store is in a consistent state for it's
    // next read/write
    await audioBlob.asyncPrepareToStoreSynchronously() 
    this.setOutputAudioBlob(audioBlob);
    speaker.queueAudioBlob(audioBlob);
  }

  /*
  title () {
    const t = super.title()
    if (t !== "") {
      return "Untitled" 
    }
    return t
  }
  */

  didUpdateSlotInputText () {
    this.setTitle(this.inputText())
    this.didUpdateNode();
    return this;
  }

  updateSubtitle (s) {
    this.setSubtitle(s);
    this.didUpdateNode();
    return this;
  }

}).initThisClass();
