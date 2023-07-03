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
      const slot = this.newSlot("outputAudioBlob", null); // sum of tokens of all messages
      //slot.setInspectorPath("")
      //slot.setLabel("output audio")
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("AudioBlob");
      //slot.setIsSubnodeField(true)
    }
  }

  initPrototype() {
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
  }

  init() {
    super.init();
    this.addAction("add");
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

  requests() {
    return this.parentNode();
  }

  speaker () {
    return this.requests().speaker()
  }

  cleanText(text) {
    // make sure we don't lose the whitespace formatting as we need it for pacing
    text = text.replaceAll("<p>", "");
    text = text.replaceAll("</p>", "\n\n");
    text = text.replaceAll("<br>", "\n\n");
    //text = text.replaceAll(".", "\n\n");

    text = text.removedHtmlTags();

    text = text.replaceAll(" - ", "... "); // quick hack to get the pause length right for list items
    //text = text.replaceAll(".\n\n", "...\n\n"); // quick hack to get the pause length right for list items
    return text;
  }

  async start() {
    const speaker = this.requests().speaker();

    const text = this.cleanText(this.inputText());
    const ssml = speaker.ssmlRequestForText(text);
    this.debugLog("start(" + text + ")");

    //this.debugLog("made request")
    const response = await fetch(
      `https://${speaker.service().region()}.tts.speech.microsoft.com/cognitiveservices/v1`,
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const audioBlob = await response.blob();
    this.setOutputAudioBlob(audioBlob);
    speaker.queueAudioBlob(audioBlob);
  }

}).initThisClass();
