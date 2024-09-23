/**
 * @module library.services.Azure.speakers.requests
 */

"use strict";

/**
 * @class AzureTtsRequest
 * @extends BMStorableNode
 * @classdesc Represents a Text-to-Speech request for Azure TTS service.
 */
(class AzureTtsRequest extends BMStorableNode {
  /**
   * Initializes the prototype slots for the AzureTtsRequest class.
   * @method
   */
  initPrototypeSlots () {
    /**
     * @property {string} inputText - The input text for the TTS request.
     */
    {
      const slot = this.newSlot("inputText", "");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    /**
     * @property {Action} startAction - The action to start the TTS request.
     */
    {
      const slot = this.newSlot("startAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Start");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("start");
    }

    /**
     * @property {AudioBlob} outputAudioBlob - The output audio blob from the TTS request.
     */
    {
      const slot = this.newSlot("outputAudioBlob", null);
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("AudioBlob");
    }

    /**
     * @property {*} error - The error object if any error occurs during the TTS request.
     */
    {
      const slot = this.newSlot("error", null);
    }
  }

  /**
   * Initializes the prototype of the AzureTtsRequest class.
   * @method
   */
  initPrototype () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * Initializes the AzureTtsRequest instance.
   * @method
   */
  init() {
    super.init();
    this.setNodeCanAddSubnode(true);
    this.setCanDelete(true);
    this.setNodeCanEditTitle(true);
    this.setTitle("Untitled");
    this.setSubtitle("tts request");
    this.setNodeCanReorderSubnodes(true);
  }

  /**
   * Performs final initialization of the AzureTtsRequest instance.
   * @method
   */
  finalInit() {
    super.finalInit();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([]);
  }

  /**
   * Returns the parent requests node.
   * @method
   * @returns {*} The parent requests node.
   */
  requests() {
    return this.parentNode();
  }

  /**
   * Returns the Azure service associated with this request.
   * @method
   * @returns {*} The Azure service.
   */
  service () {
    return this.speaker().service()
  }

  /**
   * Returns the speaker associated with this request.
   * @method
   * @returns {*} The speaker.
   */
  speaker () {
    return this.requests().speaker()
  }

  /**
   * Cleans the input text by removing HTML tags and adjusting formatting.
   * @method
   * @param {string} text - The text to clean.
   * @returns {string} The cleaned text.
   */
  cleanText (text) {
    text = text.replaceAll("<p>", "");
    text = text.replaceAll("</p>", "\n\n");
    text = text.replaceAll("<br>", "\n\n");
    text = text.removedHtmlTags();
    text = text.replaceAll(" - ", "... ");
    return text.trim();
  }

  /**
   * Returns the cleaned input text.
   * @method
   * @returns {string} The cleaned input text.
   */
  cleanedText () {
    return this.cleanText(this.inputText());
  }

  /**
   * Returns the request URL for the Azure TTS service.
   * @method
   * @returns {string} The request URL.
   */
  requestUrl () {
    return "https://" + this.speaker().service().region() + ".tts.speech.microsoft.com/cognitiveservices/v1";
  }

  /**
   * Returns the request options for the Azure TTS service.
   * @method
   * @returns {Object} The request options.
   */
  requestOptions () {

  }

  /**
   * Checks if the request can be spoken.
   * @method
   * @returns {boolean} True if the request can be spoken, false otherwise.
   */
  canSpeak () {
    const hasKey = speaker.service().apiKey() !== null;
    const hasText = this.cleanedText().length > 0;
    return hasKey && hasText;
  }

  /**
   * Starts the TTS request.
   * @method
   * @async
   */
  async start() {
    const speaker = this.speaker();
    const text = this.cleanedText();

    if (text.length === 0) {
      const errorMsg = this.type() + " requested tts on empty string"
      this.updateSubtitle("ERROR: empty text");
      this.setError(errorMsg)
      console.warn(errorMsg)
      return;
    }

    this.updateSubtitle("sending request");

    const ssml = speaker.ssmlRequestForText(text);
    this.debugLog("start(" + text + ")");

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
    this.updateSubtitle("awaiting response");

    if (!response.ok) {
      const codeString = HttpResponseCodes.shared().shortStringForCode(response.status);
      this.updateSubtitle(codeString);
      return 
    }

    this.updateSubtitle("completed");

    const audioBlob = await response.blob();
    await audioBlob.asyncPrepareToStoreSynchronously() 
    this.setOutputAudioBlob(audioBlob);
    speaker.queueAudioBlob(audioBlob);
  }

  /**
   * Returns the title of the request.
   * @method
   * @returns {string} The title of the request.
   */
  title () {
    const p = this.inputText().clipWithEllipsis(30);
    return p ? p : "Text to Speech Prompt";
  }

  /**
   * Updates the title when the input text is changed.
   * @method
   * @returns {AzureTtsRequest} The current instance.
   */
  didUpdateSlotInputText () {
    this.setTitle(this.inputText())
    this.didUpdateNode();
    return this;
  }

  /**
   * Updates the subtitle of the request.
   * @method
   * @param {string} s - The new subtitle.
   * @returns {AzureTtsRequest} The current instance.
   */
  updateSubtitle (s) {
    this.setSubtitle(s);
    this.didUpdateNode();
    return this;
  }

}).initThisClass();