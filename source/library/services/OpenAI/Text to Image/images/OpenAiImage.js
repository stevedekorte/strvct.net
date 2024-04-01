"use strict";

/* 
    OpenAiImage

*/

(class OpenAiImage extends BMSummaryNode {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("imageUrl", null);
      slot.setAnnotation("shouldJsonArchive", true)
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
      const slot = this.newSlot("revisedPrompt", null);
      slot.setAnnotation("shouldJsonArchive", true)
      slot.setInspectorPath("")
      slot.setLabel("revised prompt")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("url", null);
      slot.setAnnotation("shouldJsonArchive", true)
      slot.setInspectorPath("")
      slot.setLabel("url")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }


    {
      const slot = this.newSlot("fetchAction", null);
      slot.setInspectorPath("");
      slot.setLabel("Fetch");
      //slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setActionMethodName("fetch");
    }

    {
      const slot = this.newSlot("error", ""); // String
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      //slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("status", ""); // String
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false);
    }

    {
      const slot = this.newSlot("isLoading", false); // String
    }

  }

  init() {
    super.init();
    this.setTitle("Image");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(false);
    this.setSubnodeClasses([]);
    this.setCanAdd(false);
    this.setNodeCanReorderSubnodes(false);
  }

  finalInit() {
    super.finalInit();
    this.setCanDelete(true);
    this.setNodeFillsRemainingWidth(true);
  }

  subtitle () {
    return this.status();
  }

  images () {
    return this.parentNode();
  }

  service () {
    //return this.images().service()
    return UndreamedOfApp.shared().services().openAiService();
  }

  imagePrompt () {
    return this.images().imagePrompt();
  }

  // --- checks ---

  isLoaded () {
    return this.imageUrl() !== null;
  }

  hasError () {
    return this.error() !== "" && this.error() !== null;
  }

  // --- generate action ---

  canFetch () {
    return Type.isString(this.url());
  }

  fetchActionInfo () {
    return {
        isEnabled: this.canFetch(),
        //title: this.title(),
        isVisible: true
    }
  }

  // --- fetching the image ---

  getProxyUrl () {
    const proxyUrl = ProxyServers.shared().defaultServer().proxyUrlForUrl(this.url());
    console.log(this.type() + " url: '" + this.url() + "'");
    console.log(this.type() + " proxy url: '" + proxyUrl + "'");
    return proxyUrl;
    //return WebBrowserWindow.shared().rootUrl() + "/?proxyUrl=" + encodeURIComponent(this.url())
  }

  async fetch () {
    this.setIsLoading(true);

    const url = this.getProxyUrl();
    this.setStatus("fetching...");
    //console.log("fetch url " + this.url());
    console.log(this.type() + " fetch proxy url: " + url);

    try {
      const response = await fetch(url);

      if (!response.ok) {
          const error = new Error(`HTTP error! Status: ${response.status}`);
          throw error;
      }

      const blob = await response.blob();
      const dataUrl = await blob.asyncToDataUrl();
      this.onLoaded(dataUrl);
    } catch (error) {
      this.onError(error);
      //error.rethrow();
    }
  }

  shutdown () {
    /*
    if (this.xhr()) {
      this.xhr().abort();
    }
    */
   return this;
  }

  // --- events ---

  onLoaded (imageDataUrl) {
    this.setIsLoading(false)
    console.log('Image Data URL: ' + imageDataUrl.length + " bytes");
    this.setImageUrl(imageDataUrl);
    this.setStatus("complete")
    this.sendDelegate("onImageLoaded", [this])
  }

  onError (error) {
    this.setIsLoading(false)
    const s = "ERROR: " + error.message;
    console.error(s);
    this.setError(s);
    this.setStatus(s)
    this.sendDelegate("onImageError", [this])
  }

  delegate () {
    return this.imagePrompt()
  }

  sendDelegate (methodName, args = [this]) {
    const d = this.delegate();
    if (d) {
      const f = d[methodName];
      if (f) {
        f.apply(d, args);
        return true;
      }
    }
    return false;
  }

}.initThisClass());
