"use strict";

/* 
    MJImageJob

    An object to manage the image generation requests, 
    and polling required to get a result.

*/

(class MJImageJob extends Job {

  static systemInstructions () {
    return `
    We are using the Midjourney service for image generation. 
    The following words and phrases (formatted as json) are considered inappropriate in prompts, 
    so please omit them or find alternative words: ` + JSON.stringify(this.bannedWords());
  }

  static bannedWords () {
    return ["blood", "bloodbath", "crucifixion", "bloody", "flesh", "bruises", "car crash", "corpse", "crucified", "cutting", 
    "decapitate", "infested", "gruesome", "kill", "infected", "sadist", "slaughter", "teratoma", "tryphophobia", "wound", 
    "cronenberg", "khorne", "cannibal", "cannibalism", "visceral", "guts", "bloodshot", "gory", "killing", "surgery", "vivisection", 
    "massacre", "hemoglobin", "suicide","ahegao", "pinup", "ballgag", "playboy", "bimbo", "pleasure", "bodily fluids", "pleasures", 
    "boudoir", "rule34", "brothel", "seducing", "dominatrix", "seductive", "erotic", "fuck", "sensual", "hardcore", "sexy", "hentai", 
    "shag", "horny", "shibari", "incest", "smut", "jav", "succubus", "jerk off king at pic", "thot", "kinbaku", "transparent", 
    "legs spread", "twerk", "making love", "voluptuous", "naughty", "wincest", "orgy", "sultry", "xxx", "bondage", "bdsm", 
    "dog collar", "slavegirl", "transparent", "translucent","arse", "labia", "ass", "mammaries", "badonkers", "minge", "big ass", 
    "mommy milker", "booba", "nipple", "booty", "oppai", "bosom", "organs", "breasts", "ovaries", "busty", "penis", "clunge", 
    "phallus", "crotch", "sexy female", "dick", "skimpy", "girth", "thick", "honkers", "vagina", "hooters", "veiny", "knob", 
    "no clothes", "au naturale", "no shirt", "bare chest", "nude", "barely dressed", "bra", "risqué", "clear", "scantily", "clad", 
    "cleavage", "stripped", "full frontal", "unclothed", "invisible clothes", "wearing nothing", "lingerie", "with no shirt", "naked", 
    "without clothes on", "negligee", "zero clothes","taboo", "fascist", "nazi", "prophet mohammed", "slave", "coon", "honkey","drugs", 
    "cocaine", "heroin", "meth", "crack","torture", "disturbing", "farts", "fart", "poop", "warts", "shit", "brown pudding", "bunghole", 
    "vomit", "voluptuous", "seductive", "sperm", "hot", "sexy", "sensored", "censored", "silenced", "deepfake", "inappropriate", "pus", 
    "waifu", "mp5", "succubus", "1488", "surgery"];
  }

  initPrototypeSlots() {
    this.newSlot("mjVersion", "5.1");
    this.newSlot("prompt", null);

    this.newSlot("taskId", null);

    this.newSlot("pollCount", 0);
    this.newSlot("pollingMs", 4000);

    this.newSlot("imageUrl", 0);
  }

  init() {
    super.init();
    this.setIsDebugging(false);
  }

  newRequest() {
    const request = MJRequest.clone();
    request.setService(MJService.shared());
    return request;
  }

  isApiV2() {
    const baseUrl = MJService.shared().apiBaseUrl();
    return baseUrl && baseUrl.includes("v2");
  }

  onChange() {
    super.onChange();
    HostSession.shared().updateImageProgress(this);
  }

  assertReady() {
    super.assertReady();
    assert(this.prompt());
    assert(this.requestId());
    assert(this.mjVersion());
    assert(this.isApiV2());
  }

  async justStart() {
    await this.sendStartRequest();
    await this.pollUntilReadyOrTimeout();
    await this.sendUpscaleRequest();
    return this.imageUrl();
  }

  async sendStartRequest() {
    this.setStatus("sending image gen request");

    this.setProgress(0);
    this.onChange();

    const body = {
      prompt: this.prompt() + " --v " +  this.mjVersion()
    };

    const json = await this.newRequest().setEndpointPath("/imagine").setBody(body).asyncSend();
    this.throwIfContainsErrors(json);

    this.setTaskId(json.taskId);

    this.debugLog(json);
    this.setStatus("image request sent");
    this.setProgress(json.percentage || 0);
    this.onChange();
  }

  updateJson() {
    const json = {
      type: "updateImageProgress",
      //id: LocalUser.shared().id(),
      requestId: this.requestId(),
      percentage: this.progress(),
      timeTaken: this.timeTaken(),
      status: this.status(),
      errorMessage: this.errorMessage(),
      imageUrl: this.imageUrl(),
      imagePrompt: this.prompt()
    };
    return json;
  }

  async pollPause() {
    return new Promise((r) => setTimeout(r, this.pollingMs())); // pause until next poll
  }

  async pollUntilReadyOrTimeout () {
    assert(this.taskId());
    this.setStatus("waiting for rendering to begin");
    this.onChange();

    const startTime = new Date().getTime();
    let json;

    do {
      if (new Date().getTime() - startTime > 120000) {
        this.throwError(new Error("Timeout waiting for Midjourney"));
      }
      await this.pollPause(); // pause until next poll
      json = await this.pollRequest()
      
    } while (!json.imageURL);

    this.setImageUrl(json.imageURL); // non-upscaled version set until we have the full version
    this.setStatus("got low scale image");
    this.setProgress(99);
    this.onChange();
  }

  async pollRequest () {
    this.setPollCount(this.pollCount() + 1);

    const json = await this.newRequest()
      .setEndpointPath("/result")
      .setBody({ taskId: this.taskId() })
      .asyncSend();
    this.debugLog(json);
    this.throwIfContainsErrors(json);


    if (json.percentage) {
      this.setStatus("rendering " + json.percentage + "%");
      this.setProgress(json.percentage);
      this.onChange();
    } else {
      this.setStatus("polled " + this.pollCount() + " times waiting for rendering to begin");
      this.onChange();
    }
    return json;
  }

  async sendUpscaleRequest () {
    const startTime = new Date().getTime();
    let json;

    this.setStatus("upscaling");
    this.onChange();

    this.setPollCount(0);
    do {
      if (new Date().getTime() - startTime > 120000) {
        this.throwError(new Error("Timeout waiting for midjourney"));
      }

      await new Promise((r) => setTimeout(r, this.pollingMs()));
      json = await this.newRequest()
        .setEndpointPath("/upscale")
        .setBody({ 
          taskId: this.taskId(), 
          position: 1 // choose the first image of the set
        })
        .asyncSend();
      this.debugLog(json);
      this.throwIfContainsErrors(json);

      if (json.imageURL) {
        this.setImageUrl(json.imageURL);
        break;
      } else {
        this.setPollCount(this.pollCount() + 1);
        if (json.percentage) {
          this.setStatus("upscaling " + json.percentage + "%");
        } else {
          this.setStatus("upscaling - polled " + this.pollCount() + " times");
        }
        this.onChange();
      }
    } while (true);
  }

  throwIfContainsErrors(json) {
    if (json.errors) {
      const s = json.errors.map(e => e.msg).join(",");
      this.throwError(new Error(s));
    }
  }

}).initThisClass();
