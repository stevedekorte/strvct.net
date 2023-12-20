"use strict";

/* 
    OpenAiTtsRequest
 
*/

(class OpenAiTtsRequest extends BMSummaryNode {
 
  initPrototypeSlots() {
    {
      const slot = this.newSlot("delegate", null); // optional reference to service object that owns request - will receive onRequestComplete message if it responds to it
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
      const slot = this.newSlot("apiKey", null);
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
      const slot = this.newSlot("lastContent", ""); // useful when separating renderable html while streaming
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
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

    this.setShouldStore(false)
    this.setShouldStoreSubnodes(false)
  }

  init () {
    super.init();
    this.setIsDebugging(true);
    this.setRequestId(this.puuid());
    this.setTitle("Request")
  }

  subtitle () {
    return this.status();
  }

  setService (anObject) {
    this.setDelegate(anObject);
    return this;
  }

  body () {
    return JSON.stringify(this.bodyJson(), 2, 2);
  }

  requestOptions () {
    const apiKey = this.apiKey();
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
    if (!this.apiUrl()) {
      throw new Error(this.type() + " apiUrl missing");
    }

    if (!this.apiKey()) {
      throw new Error(this.type() + " apiKey missing");
    }
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
      this.setStatus("fetching")
      this.setIsStreaming(false);
      this.sendDelegate("onRequestBegin")

      this.assertValid();
      if (this.isDebugging()) {
        this.showRequest();
      }

      const options = this.requestOptions();
      const controller = new AbortController();
      this.setFetchAbortController(controller);
      options.signal = controller.signal; // add the abort controller so we can abort the fetch if needed

      const fetchRequest = fetch(this.apiUrl(), options);

      fetchRequest.then((response) => {
        this.setIsFetchActive(false);
        this.setFetchAbortController(null);
        //return response.json();
      }).catch((error) => {
        this.setIsFetchActive(false);
          console.error('Error:', error);
      });

      const response = await fetchRequest;
      const json = await response.json();
      this.setJson(json);
      if (json.error) {
        this.onError(new Error(json.error.message))
      } else {
        this.setFullContent(json.choices[0].message.content);
        this.sendDelegate("onRequestComplete")
        //this.showResponse();
        this.setStatus("completed " + this.responseSizeDescription())
        return json
      }
    } catch (error) {
      this.onError(error)
    }

    return undefined;
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
