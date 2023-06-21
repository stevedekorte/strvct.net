"use strict";

/* 
    OpenAiImageGen

*/

(class OpenAiImageGen extends BMStorableNode {
  initPrototypeSlots() {
    this.newSlot("prompt", null);
    this.newSlot("systemInstructions", "");
  }

  init() {
    super.init();
  }

  newRequest () {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/images/generations");
    request.setApiKey(this.apiKey());
    return request;
  }

  // Calls the OpenAI Image API and returns the image URL fetchOpenAIImageResponse
  async asyncFetch() {
    assert(this.prompt());

    this.prompt().copyToClipboard(); // so the user can easily paste it into MidJourney

    const request = this.newRequest().setBodyJson({
      prompt: this.prompt(),
      n: 1,
      size: "512x512",
    });

    let json = undefined;
    try {
      //debugger;
      json = await request.asyncSend();
    } catch (error) {
      //debugger;
      console.error("Error fetching AI response:", error);
      AiChatColumn.shared().addMessage(
        "systemMessage",
        "Error fetching AI response:" + error.message,
        "Host",
        LocalUser.shared().id()
      );
      return undefined
    }

    const imageURL = json.data[0].url;
    return imageURL;
  }
}.initThisClass());

