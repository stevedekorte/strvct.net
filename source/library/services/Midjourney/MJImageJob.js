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
    
    {
      const slot = this.newSlot("mjVersion", "5.1");      
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      //slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("prompt", null);
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
    }

    {
      const slot = this.newSlot("taskId", null);      
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("pollCount", 0);
      slot.setInspectorPath("")
      //slot.setLabel("prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("pollingMs", 4000);
      slot.setInspectorPath("")
      slot.setLabel("Poll period in ms")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("unscaledImageUrl", null);
      slot.setInspectorPath("")
      slot.setLabel("unscaled image set")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("ImageWell")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("imageUrl", null);
      slot.setInspectorPath("")
      slot.setLabel("image")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("ImageWell")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("request", null);
      slot.setInspectorPath("")
      //slot.setLabel("image")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      //slot.setIsSubnodeField(true)
      slot.setSlotType("Pointer")
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("requestsNode", null);
    }

    {
      const slot = this.newSlot("toggleRunning", null);
      slot.setInspectorPath("")
      slot.setLabel("Start")
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Action")
      slot.setIsSubnodeField(true)
      slot.setActionMethodName("toggleRunning");
    }


    //this.newSlot("toggleRunningButton", null)
    //this.setNodeSubtitleIsChildrenSummary(true)
    this.setShouldStoreSubnodes(false)
  }

  init() {
    super.init();
    this.setIsDebugging(false);
    //this.setTitle("Untitled Image Job")
  }

  title () {
    if (this.prompt() === "") {
      return "Untitled Image Job"
    }
    return this.prompt()
  }

  finalInit () {
    super.finalInit()
    this.setCanDelete(true)
    this.setNodeCanEditTitle(false)

    {
      const node = BMSummaryNode.clone().setTitle("requests")
      node.setNoteIsSubnodeCount(true)
      this.setRequestsNode(node)
      this.addSubnode(node)
    }

    /*
    {
      const action = BMActionField.clone().setTitle("Start").setTarget(this).setMethodName("toggleRunning") // justStart
      //action.setIsEnabled(true)
      this.addSubnode(action)
      this.setToggleRunningButton(action)
    }
    */

    this.setNodeSubtitleIsChildrenSummary(false)
  }

  // ----

  /*
  toggleRunningActionDict() {
    return {
      isEnabled: true,
      title: "Start"
    }
  }

  toggleRunningAction_isEnabled() {
    return true
  }
  */

  // --------------------

  jobs () {
    return this.parentNode()
  }

  newRequest() {
    const request = MJRequest.clone();
    request.setService(this.jobs().service());

    //const pollRequests = this.requestsNode().subnodes().select(sn => sn.title().includes("poll"))
    //this.requestsNode().removeSubnodes(pollRequests);
    this.requestsNode().addSubnode(request);
    return request;
  }

  isApiV2() {
    const baseUrl = MJService.shared().apiBaseUrl();
    return baseUrl && baseUrl.includes("v2");
  }

  onChange() {
    super.onChange();
    this.updateActions()
    this.setSubtitle(this.status())
    this.subtitle()
    //HostSession.shared().updateImageProgress(this);
  }

  /*
  didUpdateSlot(aSlot, oldValue, newValue) {
    const v = super.didUpdateSlot(aSlot, oldValue, newValue)
    return v
  }
  */

  assertReady() {
    super.assertReady();
    assert(this.prompt());
    assert(this.requestId());
    assert(this.mjVersion());
    assert(this.isApiV2());
  }

  clear () {
    this.requestsNode().removeAllSubnodes();
    this.setUnscaledImageUrl(null);
    this.setImageUrl(null);
    this.setPollCount(0);
    this.setTaskId(null);
    return this;
  }

  async justStart() {
    this.clear()
    await this.sendStartRequest();
    await this.pollUntilReadyOrTimeout();
    await this.sendUpscaleRequest();
    return this.imageUrl();
  }

  stop () {
    const r = this.request();
    if (r) {
      r.abort()
      this.onChange()
    }
    return this
  }

  toggleRunning () {
    if (this.isRunning()) {
      this.stop()
    } else {
      this.justStart()
    }
    return this
  }

  isRunning () {
    return this.request() && this.request().isRunning()
  }

  updateActions () {
    const isRunning = this.isRunning()
    //const button = this.toggleRunningButton()
    //button.setTitle(isRunning ? "Stop" : "Start")
    return this
  }

  async sendStartRequest() {
    this.setStatus("sending image gen request");
    //debugger

    this.setProgress(0);
    this.onChange();

    const body = {
      prompt: this.prompt() //+ " --v " +  this.mjVersion()
    };

    const request = this.newRequest()
    this.setRequest(request)
    request.setTitle("render request")
    const json = await request.setEndpointPath("/imagine").setBody(body).asyncSend();
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
    //debugger;

    const imageDataUrl = await this.getDataForUrl(json.imageURL)

    this.setUnscaledImageUrl(imageDataUrl); // non-upscaled version set until we have the full version
    this.setStatus("got low scale image");
    this.setProgress(99);
    this.onChange();
  }

  async pollRequest () {
    this.setPollCount(this.pollCount() + 1);

    const request = this.newRequest();
    this.setRequest(request)
    request.setTitle("poll request " + this.pollCount())
    request.setEndpointPath("/result")
    request.setBody({ taskId: this.taskId() });

    const json = await request.asyncSend();
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

  async getDataForUrl (url) {
    // Function to convert blob to data URL
    function blobToDataURL(blob) {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
    }

    // Fetch image
    return fetch(url)
      .then(response => response.blob()) // Get blob from response
      .then(blob => blobToDataURL(blob)) // Convert blob to data URL
      .then(dataURL => {
          console.log(dataURL); // Use data URL (e.g., for displaying in an <img> element)
          return dataURL
      })
      .catch(err => {
          console.error(err);
          throw err
      });
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
      const request = this.newRequest();
      request.setTitle("upscale request")
      this.setRequest(request);

      json = await request
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
        this.setRequest(null)
        this.setStatus("complete");
        this.onChange();
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
