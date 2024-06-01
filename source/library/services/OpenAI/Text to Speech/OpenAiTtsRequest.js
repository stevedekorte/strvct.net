"use strict";

/* 
    OpenAiTtsRequest
 
*/

(class OpenAiTtsRequest extends BMSummaryNode {
 
  initPrototypeSlots () {
    {
      const slot = this.newSlot("delegate", null); // optional reference to service object that owns request 
    }

    {
      const slot = this.newSlot("requestId", null); // needed?
    }

    {
      const slot = this.newSlot("apiUrl", null);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("bodyJson", null); // this will contain the model choice and messages
    }

    {
      const slot = this.newSlot("body", null); 
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    // fetching

    {
      const slot = this.newSlot("fetchRequest", null);
    }

    {
      const slot = this.newSlot("isFetchActive", false);
    }

    {
      const slot = this.newSlot("fetchAbortController", null);
    }

    {
      const slot = this.newSlot("error", null);
    }

    {
      const slot = this.newSlot("status", "");
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("fetchPromise", null);
    }

    {
      const slot = this.newSlot("audioBlob", null);
    }

    {
      const slot = this.newSlot("sound", null); // WASound
    }

    this.setShouldStore(false)
    this.setShouldStoreSubnodes(false)
  }

  init () {
    super.init();
    this.setIsDebugging(false);
    this.setRequestId(this.puuid());
    this.setTitle("Request");

    this.setFetchPromise(Promise.clone());
    this.setSound(WASound.clone());
    this.sound().setFetchPromise(this.fetchPromise());
  }

  service () {
    return OpenAiService.shared();
  }

  subtitle () {
    return this.status();
  }

  setService (anObject) {
    debugger;
    this.setDelegate(anObject);
    return this;
  }

  body () {
    return JSON.stringify(this.bodyJson(), 2, 2);
  }

  requestOptions () {
    const apiKey = this.service().apiKey();
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(this.bodyJson()),
    };
  }

  assertValid () {
    assert(this.service().hasApiKey(), this.type() + " apiKey missing");
    assert(this.apiUrl(), this.type() + " apiUrl missing");
  }

  showRequest () {
    this.debugLog(
      " request " +
      this.requestId() +
      " apiUrl: " +
        this.apiUrl() +
        " body: " + 
        JSON.stringify(this.bodyJson()) +
        "'"
    );
  }

  showResponse () {
    const json = this.json();
    this.debugLog(" response json: ", json);
    if (json.error) {
      console.warn(this.type() + " ERROR:", json.error.message);
    }
  }

  // --- normal response --- 

  async asyncSend () {
    try {
      this.setStatus("fetching");
      //this.setIsStreaming(false);
      this.sendDelegate("onRequestBegin");

      this.assertValid();
      if (this.isDebugging()) {
        this.showRequest();
      }

      const options = this.requestOptions();
      const controller = new AbortController();
      this.setFetchAbortController(controller);
      options.signal = controller.signal; // add the abort controller so we can abort the fetch if needed

      const response = await fetch(this.apiUrl(), options);
      this.setIsFetchActive(false);
      this.setFetchAbortController(null);
      //this.sendDelegate("onRequestConnected");

      const audioBlob = await response.blob();
      this.fetchPromise().callResolveFunc();
      this.setAudioBlob(audioBlob);
      //this.sendDelegate("onRequestGotAudioBlob");

      // need to call asyncPrepareToStoreSynchronously as OutputAudioBlob slot is stored,
      // and all writes to the store tx need to be sync so the store is in a consistent state for it's
      // next read/write
      //await audioBlob.asyncPrepareToStoreSynchronously() 
      //const sound = WASound.fromBlob(audioBlob);
      this.sound().asyncLoadFromDataBlob(audioBlob);

      this.sendDelegate("onRequestComplete");

    } catch (error) {
      this.setIsFetchActive(false);
      console.error('Error:', error);
      this.onError(error);
    }
  }

  abort () {
    if (this.isFetchActive()) {
      if (this.fetchAbortController()) {
        this.fetchAbortController().abort();
      }
      return this;
    } 

    return this;
  }

  shutdown () {
    this.abort();
    return this;
  }

  onError (error) {
    this.sendDelegate("onRequestError", [this, error]);
    this.fetchPromise().callRejectFunc(error);
  }

  sendDelegate (methodName, args = [this]) {
    const d = this.delegate()
    if (d) {
      const f = d[methodName]
      if (f) {
        f.apply(d, args)
        return true
      }
    }
    return false
  }

}.initThisClass());
