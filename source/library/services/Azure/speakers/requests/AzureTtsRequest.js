/**
 * @module library.services.Azure.speakers.requests
 */

"use strict";

/**
 * @class AzureTtsRequest
 * @extends SvStorableNode
 * @classdesc Represents a Text-to-Speech request for Azure TTS service.
 */
(class AzureTtsRequest extends SvStorableNode {
  /**
   * Initializes the prototype slots for the AzureTtsRequest class.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {string} inputText - The input text for the TTS request.
     * @category Data
     */
    {
      const slot = this.newSlot("inputText", "");
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setIsSubnodeField(true);
    }

    /**
     * @member {Action} startAction - The action to start the TTS request.
     * @category Action
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
     * @member {AudioBlob} outputAudioBlob - The output audio blob from the TTS request.
     * @category Data
     */
    {
      const slot = this.newSlot("outputAudioBlob", null);
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("AudioBlob");
    }

    /**
     * @member {*} error - The error object if any error occurs during the TTS request.
     * @category Error Handling
     */
    {
      const slot = this.newSlot("error", null);
      slot.setSlotType("String");
    }
  }

  /**
   * Initializes the prototype of the AzureTtsRequest class.
   * @category Initialization
   */
  initPrototype () {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  /**
   * Initializes the AzureTtsRequest instance.
   * @category Initialization
   */
  init () {
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
   * @category Initialization
   */
  finalInit () {
    super.finalInit();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([]);
  }

  /**
   * Returns the parent requests node.
   * @returns {*} The parent requests node.
   * @category Hierarchy
   */
  requests () {
    return this.parentNode();
  }

  /**
   * Returns the Azure service associated with this request.
   * @returns {*} The Azure service.
   * @category Service
   */
  service () {
    return this.speaker().service()
  }

  /**
   * Returns the speaker associated with this request.
   * @returns {*} The speaker.
   * @category Service
   */
  speaker () {
    return this.requests().speaker()
  }

  /**
   * Cleans the input text by removing HTML tags and adjusting formatting.
   * @param {string} text - The text to clean.
   * @returns {string} The cleaned text.
   * @category Text Processing
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
   * @returns {string} The cleaned input text.
   * @category Text Processing
   */
  cleanedText () {
    return this.cleanText(this.inputText());
  }

  /**
   * Returns the request URL for the Azure TTS service.
   * @returns {string} The request URL.
   * @category HTTP
   */
  requestUrl () {
    return "https://" + this.speaker().service().region() + ".tts.speech.microsoft.com/cognitiveservices/v1";
  }

  /**
   * Returns the request options for the Azure TTS service.
   * @returns {Object} The request options.
   * @category HTTP
   */
  requestOptions () {

  }

  /**
   * Checks if the request can be spoken.
   * @returns {Promise<boolean>} True if the request can be spoken, false otherwise.
   * @category Validation
   */
  async canSpeak () {
    const speaker = this.speaker();
    const hasKey = await speaker.service().apiKeyOrUserAuthToken() !== null;
    const hasText = this.cleanedText().length > 0;
    return hasKey && hasText;
  }

  /**
   * Starts the TTS request.
   * @async
   * @category Action
   */
  async start () {
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
          "Ocp-Apim-Subscription-Key": await speaker.service().apiKeyOrUserAuthToken(),
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
   * @returns {string} The title of the request.
   * @category UI
   */
  title () {
    const p = this.inputText().clipWithEllipsis(30);
    return p ? p : "Text to Speech Prompt";
  }

  /**
   * Updates the title when the input text is changed.
   * @returns {AzureTtsRequest} The current instance.
   * @category UI
   */
  didUpdateSlotInputText () {
    this.setTitle(this.inputText())
    this.didUpdateNode();
    return this;
  }

  /**
   * Updates the subtitle of the request.
   * @param {string} s - The new subtitle.
   * @returns {AzureTtsRequest} The current instance.
   * @category UI
   */
  updateSubtitle (s) {
    this.setSubtitle(s);
    this.didUpdateNode();
    return this;
  }

}).initThisClass();