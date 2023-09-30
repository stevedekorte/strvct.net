"use strict";

/* 
    OpenAiChatModel

*/

(class OpenAiChatModel extends BMSummaryNode {
  initPrototypeSlots() {
    this.newSlot("name", null);
    {
      const slot = this.newSlot("isAvailable", undefined)
      slot.setShouldStoreSlot(true);
      slot.setSyncsToView(true)
      slot.setSlotType("Boolean")
      //slot.setValidValues([true, false]);
      //slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }
    {
      const slot = this.newSlot("isChecking", false);
      slot.setSlotType("Boolean")
      slot.setShouldStoreSlot(false)
      slot.setSyncsToView(true)
      //slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }
  }

  init() {
    super.init();
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);

  }

  finalInit () {
    super.finalInit();
    this.setHasNewlineAferSummary(true)
    //this.setSummaryFormat("key value")
    this.setSummaryFormat("key")
    this.setHidePolicy("hide if value is false")
  }

  subtitle () {
    //return this.isAvailable() ? "☑" : "☒";
    return this.isAvailable() ? "available" : "";
  }

  models () {
    return this.parentNode()
  }

  apiKey () {
    return this.models().service().apiKey();
  }

  title () {
    return this.name()
  }

  async asyncCheckAvailability () {
    if (this.isChecking()) {
      return undefined;
    }

    //debugger;
    if (!this.apiKey()) {
      console.warn(this.type() + " " + this.title() + " asyncCheckAvailability() - no api key");
      //debugger;
      return null
    }

    //console.log("api key: '" + this.apiKey() + "'");

    const request = this.newRequest().setBodyJson({
      model: this.name(),
      messages: [{
        role: "user",
        content: `Respond only with the word "hello".`,
      }],
      temperature: 0, 
      top_p: 0 
    });

    this.setIsChecking(true);
    await request.asyncSend();
    this.setIsChecking(false);

    if (request.error()) {
      this.setIsAvailable(false);
      return false
    }

    const json = request.json() // should this be an await?
    if (json.error) {
      /*
        TODO: 
        - add check for "model does not exist" to ensure it's a model error
        - otherwise, retry with backoff?
      */
     console.log(this.type()  + " " + this.name() + " asyncCheckAvailability " + json.error.code);
      this.setIsAvailable(false);
    } else {
      this.setIsAvailable(true);
    }
    return this.isAvailable();
  }

  newRequest() {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    return request;
  }

}.initThisClass());
