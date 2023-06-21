"use strict";

/* 
    ImageBotJob.js

    Takes a scene descriptions, gets a summary, then starts an image gen job to render it.

*/

(class ImageBotJob extends Job {
  initPrototypeSlots() {
    // turning sceneDescription into sceneSummary
    this.newSlot("sceneDescription", null);
    this.newSlot("sceneSummaryRequest", null); // request to open ai for image prompt
    this.newSlot("sceneSummary", null); 

    // turning imagePrompt into imageUrl
    this.newSlot("imagePrompt", null);  // constructed from sceneSummary
    this.newSlot("imageGenJob", null); 
    this.newSlot("imageUrl", null); 
  }

  init () {
    super.init();
    return this;
  }

  onChange() { // overridden job method
    super.onChange();
    HostSession.shared().updateImageProgress(this);
  }

  assertReady () {
    super.assertReady();
    assert(this.requestId());
    assert(this.sceneDescription() || this.sceneSummary());
  }

  async justStart() {
    // calling method is wrapped in try, so no try needed here
    if (!this.sceneSummary()) {
      await this.requestSceneSummary();
    }
    await this.requestImage();
    return this.imageUrl();
  }

  sceneSummaryRequestPrompt () {
    return `We are playing a roleplaying game and need a description of the current scene in order to generate an image. 
I will give you the background information for the characters and setting, and then the details of the current scene. 
Using what you know of the background, describe the current scene in a single sentence using simple language which can be used to generate an image. 
Do not use character's names, or location names. 
No proper nouns.\n\n${MJImageJob.systemInstructions()}. Here is the current scene: \n\n ` +
      this.sceneDescription();
  }

  async requestSceneSummary() {
    this.setStatus("requesting scene summary");
    this.onChange();

    const request = OpenAiRequest.clone();
    this.setSceneSummaryRequest(request);

    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(OpenAiService.shared().apiKey());
    request.setBodyJson({
        model: SessionOptionsView.shared().aiModel(),
        messages: [{ 
            role: "user", 
            content: this.sceneSummaryRequestPrompt() 
        }]
    });

    const data = await request.asyncSend();
    if (data.error) {
      this.throwError(new Error("requestSceneSummary: " + data.error.message));
    }
    const summary = data.choices[0].message.content;
    this.setSceneSummary(summary);
    return summary;
  }

  calcImagePrompt () {
    const imagePrompt = SessionOptionsView.shared().artPromptPrefix() + " " + this.sceneSummary() + ". " + SessionOptionsView.shared().artPromptSuffix();
    console.log("imagePrompt: [[" + imagePrompt + "]]");
    this.setImagePrompt(imagePrompt);
    return imagePrompt;
  }

  async requestImage () {
    this.setStatus("requesting image");
    this.onChange();

    const job = MJImageJobs.shared().newJob();
    job.setPrompt(this.calcImagePrompt());
    job.setRequestId(this.requestId());
    this.setImageGenJob(job);

    const imageUrl = await job.start();
    this.setImageUrl(imageUrl);

    if (imageUrl) {
      HostSession.shared().broadcastImage(imageUrl, this.requestId());
      AiChatColumn.shared().addImage(imageUrl, this.requestId());
    }
    return imageUrl;
  }

}).initThisClass();
