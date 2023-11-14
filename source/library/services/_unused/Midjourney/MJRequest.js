"use strict";

/* 
    MJRequest

    Wrapper for API request

*/

(class MJRequest extends BMStorableNode {
  initPrototypeSlots () {
    {
      const slot = this.newSlot("endpointPath", null);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("service", null);
    }

    {
      const slot = this.newSlot("body", null); // JSON object
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      //slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("bodyJson", null); // JSON object
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("responseJson", null); // JSON object
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("startTime", null); 
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setCanEditInspection(false)
      slot.setSyncsToView(true)
    }
    
    {
      const slot = this.newSlot("timeoutMs", 120000);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("timeoutId", null);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(false)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("error", null);
      slot.setSyncsToView(true)
    }

    {
      const slot = this.newSlot("fetchAbortController", null);
    }

    this.setShouldStoreSubnodes(false)
    this.setShouldStore(true)
  }

  init () {
    super.init();
    this.setTitle("request")
    this.setService(MJService.shared());
    this.setIsDebugging(false)
  }

  status () {
    return this.subtitle()
  }

  setStatus (s) {
    this.setSubtitle(s)
    return this
  }

  isRunning () {
    return this.fetchAbortController() !== null;
  }

  didUpdateSlotBody () {
    this.setBodyJson(JSON.stringify(this.requestOptions(), 2, 2))
  }

  requestOptions () {
    const apiKey = this.service().apiKey();
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey,
      },
      body: JSON.stringify(this.body()),
    };
  }

  endpointUrl() {
    return this.service().apiBaseUrl() + this.endpointPath();
  }

  assertValid () {
    if (!this.service()) {
      this.throwError(new Error(this.type() + " service missing"));
    }

    if (!this.service().apiKey()) {
      this.throwError(new Error(this.type() + " apiKey missing"));
    }

    if (!this.service().apiBaseUrl()) {
      this.throwError(new Error(this.type() + " apiBaseUrl missing"));
    }
  }

  throwError(error) {
    this.setError(error)
    this.setStatus(error.message)
    throw error
  }
  
  async asyncSend () {
    this.setStartTime(new Date().getTime());
    this.assertValid()

    const requestOptions = this.requestOptions()

    this.debugLog(" send request endpointUrl:" +  this.endpointUrl() + "options: \n", requestOptions);
    this.setStatus("sending")

    const controller = new AbortController();
    this.setFetchAbortController(controller);
    requestOptions.signal = controller.signal; // add the abort controller so we can abort the fetch if needed

    const fetchPromise = fetch(this.endpointUrl(), requestOptions);
    const timeoutPromise = this.newTimeoutPromise();
    this.setResponseJson("")

    return Promise.race([fetchPromise, timeoutPromise])
      .then(async (response) => {
        this.clearTimeout();
        this.setStatus("got response")
        const json = await response.json();

        if (json.taskId) {
          this.setStatus("started task")
        } else if (json.percentage) {
          this.setStatus(json.percentage + "% complete")
        } else if (json.status) {
          this.setStatus(json.status)
        } else if (json.imageURL) {
          this.setStatus("complete")
        } 

        this.setResponseJson(JSON.stringify(json, 2, 2))
        return json
      })
      .catch(error => {
        const errorMessage = "request timeout after " + (this.timeoutMs()/1000) + " seconds"
        this.throwError(new Error(errorMessage));
      })
      .finally(() => {
        this.clearAbortController()
      })
  }

  description () {
    return this.type() + " url:" + this.endpointUrl() + " request:" + JSON.stringify(this.requestOptions());
  }

  newTimeoutPromise () {
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('Request timed out')), this.timeoutMs());
      this.setTimeoutId(timeoutId);
    });
    return timeoutPromise;
  }

  clearTimeout () {
    if (this.timeoutId()) {
      clearTimeout(this.timeoutId());
      this.setTimeoutId(null);
    }
    return this;
  }
    
  abort () {
    if (this.fetchAbortController()) {
      this.fetchAbortController().abort();
      this.clearAbortController()
    }
    return this;
  }

  clearAbortController () {
    this.setFetchAbortController(null)
    return this
  }

}.initThisClass());


