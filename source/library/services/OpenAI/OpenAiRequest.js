"use strict";

/* 
    OpenAiRequest

    Wrapper for request to OpenAi API

*/

(class OpenAiRequest extends BMStorableNode {

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

    {
      const slot = this.newSlot("json", null);
    }

    // fetching

    {
      const slot = this.newSlot("fetchRequest", null);
    }

    {
      const slot = this.newSlot("isFetchActive", false);
      /*
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
      */
    }

    {
      const slot = this.newSlot("fetchAbortController", null);
    }

    // streaming

    {
      const slot = this.newSlot("isStreaming", false); // external read-only
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Boolean")
      slot.setIsSubnodeField(true)
    }

    {
      const slot = this.newSlot("streamTarget", null); // will receive onStreamData and onStreamComplete messages
    }

    {
      const slot = this.newSlot("xhr", null);
    }

    {
      const slot = this.newSlot("xhrResolve", null); 
    }

    {
      const slot = this.newSlot("xhrReject", null); 
    }

    {
      const slot = this.newSlot("requestId", null);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("readIndex", 0);
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("readLines", null);
    }

    {
      const slot = this.newSlot("fullContent", null); 
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
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
    //this.setLastContent("");
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

  responseSizeDescription () {
    const size = this.xhr() ? this.xhr().responseText.length : 0;
    return ByteFormatter.clone().setValue(size).formattedValue();
  }

  // --- helpers ---


  description() {
    return (
      this.type() +
      " url:" +
      this.apiUrl() +
      " request:" +
      JSON.stringify(this.requestOptions())
    );
  }

  // --- streaming response --- 

  assertReadyToStream () {
    const target = this.streamTarget();
    if (target) {
      // verify streamTarget protocol is implemented by it
      assert(target.onStreamData);
      assert(target.onStreamComplete);
    }
  }

  async asyncSendAndStreamResponse () {
    this.assertValid();
    assert(!this.xhr());

    this.assertReadyToStream();
    
    this.setIsStreaming(true);
    this.setStatus("streaming")

    this.bodyJson().stream = true;
    this.setReadLines([]);

    const xhr = new XMLHttpRequest();
    this.setXhr(xhr);
    xhr.open("POST", this.apiUrl());

    // set headers
    const options = this.requestOptions();
    for (const header in options.headers) {
      const value = options.headers[header];
      xhr.setRequestHeader(header, value);
    }

    xhr.responseType = ""; // "" or "text" is required for streams

    this.setFullContent("");

    // why false arg? see https://stackoverflow.com/questions/51204603/read-response-stream-via-xmlhttprequest
    xhr.addEventListener("progress", (event) => this.onXhrProgress(event), false);
    xhr.addEventListener("loadend", (event) => this.onXhrLoadEnd(event));
    xhr.addEventListener("error", (event) => this.onXhrError(event));
    xhr.addEventListener("abort", (event) => this.onXhrAbort(event));

    const promise = new Promise((resolve, reject) => {
      this.setXhrResolve(resolve);
      this.setXhrReject(reject);
    });

    //const s = JSON.stringify(options, 2, 2);
    //this.debugLog("SENDING REQUEST BODY:", options.body)
    xhr.send(options.body);

    return promise;
  }

  onXhrProgress (event) {
    this.onXhrRead();
  }

  sendDelegate (methodName) {
    const d = this.delegate()
    if (d) {
      const f = d[methodName]
      if (f) {
        f.apply(d, [this])
        return true
      }
    }
  }

  onXhrLoadEnd (event) {
    //debugger
    const isError = this.xhr().status >= 300
    if (isError) {
      const json = JSON.parse(this.xhr().responseText);
      if (json.error) {
        this.onError(new Error(json.error.message));
      } else {
        this.onError(new Error("request error code:" + this.xhr().status + ")"));
      }
    } else {
      this.readXhrLines() // finish reading any remaining lines
    }

    this.streamTarget().onStreamComplete(this);
    this.sendDelegate("onRequestComplete")
    this.setStatus("completed " + this.responseSizeDescription())
    this.xhrResolve()(this.fullContent()); 
  }

  didUpdateSlotError (oldValue, newValue) {
    //debugger
    if (newValue) {
      this.setStatus("ERROR: " + newValue.message)
    }
  }

  onError (e) {
    //debugger
    this.setError(e);
    this.sendDelegate("onRequestError")

    if (e) {
      console.warn(this.debugTypeId() + " " + e.message);
    }
    return this;
  }

  onXhrError (event) {
    const xhr = this.xhr();
    // error events don't contain messages - need to look at xhr and guess at what happened
    let s = "got an error on xhr requestId" + this.requestId() + ":";
    s += "  xhr.status:     " + xhr.status; // e.g. 404 = file not found
    s += "  xhr.statusText: '" + xhr.statusText + "'";
    s += "  xhr.readyState: ", xhr.readyState; // e.g.. 4 === DONE
    const error = new Error(s);
    this.onError(error);
    this.streamTarget().onStreamComplete(this);
    this.xhrReject()(error);
  }

  onXhrAbort (event) {
    this.setStatus("aborted")
    this.streamTarget().onStreamComplete(this);
    this.xhrReject()(new Error("aborted"));
  }

  unreadResponse () {
    const unread = this.xhr().responseText.substr(this.readIndex());
    return unread
  }

  readNextXhrLine () {
    const unread = this.unreadResponse();
    const newLineIndex = unread.indexOf("\n");

    if (newLineIndex === -1) {
      return undefined; // no new line found
    }

    let newLine = unread.substr(0, newLineIndex);
    this.setReadIndex(this.readIndex() + newLineIndex + 1); // advance the read index

    return newLine;
  }

  onXhrRead () {
    this.readXhrLines()
  }


  readXhrLines () {
    try {
      let line = this.readNextXhrLine();

      while (line !== undefined) {
        line = line.trim()
        if (line.length) {
          if (line.startsWith("data:")) {
            const s = line.after("data:");
            if (line.includes("[DONE]")) {
              // skip, stream is done and will close
            } else {
              // we should expect json
              //console.log("LINE: " + s)
              const json = JSON.parse(s);
              this.onStreamJsonChunk(json);
            }
          } 
        }
        line = this.readNextXhrLine();
      }
    } catch(error) {
      this.onError(error);
      console.warn(this.type() + " ERROR:", error);
      this.xhrReject()(new Error(error));
    }
  }

  onStreamJsonChunk (json) {
    if (json.error) {
      console.warn("ERROR: " + json.error.message);
      this.xhrReject()(new Error(json.error.message));
    } else if (
        json.choices &&
        json.choices.length > 0 &&
        json.choices[0].delta &&
        json.choices[0].delta.content
      ) {
        const newContent = json.choices[0].delta.content;
        this.setFullContent(this.fullContent() + newContent);
        this.streamTarget().onStreamData(this, newContent);
        //console.warn("CONTENT: ", newContent);

    } else {
      if (json.id) {
        //console.warn("HEADER: ", JSON.stringify(json));
        // this is the header chunk - do we need to keep this around?
      } else {
        console.warn("WARNING: don't know what to do with this JsonChunk", json);
      }
    }
  }

  isActive () {
    const xhr = this.xhr();
    if (xhr) {
      const state = xhr.readyState;
      return (state >= 1 && state <= 3);
    }
    return false;
  }
  
  abort () {
    if (this.isFetchActive()) {
      if (this.fetchAbortController()) {
        this.fetchAbortController().abort();
      }
      return this;
    } 

    if (this.isActive()) {
      this.xhr().abort();
    }
    return this;
  }

}).initThisClass();