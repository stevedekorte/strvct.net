"use strict";

/* 
    AiJsonRequest

  An AiRequest that uses a JsonStreamReader to parse the response
  and calls onJsonStreamReaderPopContainer(reader, json) with each container parsed

*/

(class AiJsonRequest extends AiRequest { 

  initPrototypeSlots() {
    {
      const slot = this.newSlot("jsonStreamReader", null);
    }

    {
      const slot = this.newSlot("containerChunkLevel", 2); // depth of json to call onStreamJsonChunk(json)
    }
  }

  init () {
    super.init();
    this.setIsDebugging(true);


    const reader = JsonStreamReader.clone();
    reader.setDelegate(this);
    this.setJsonStreamReader(reader);
    //reader.endJsonStream();
  }


  setupForStreaming () {
    return this;
  }

   // --- streaming ---

  async asyncSendAndStreamResponse () {
    if (!this.isContinuation()) {
      this.jsonStreamReader().beginJsonStream();
    }
    return super.asyncSendAndStreamResponse();
  }


   readXhrLines () {
    try {
      const newText = this.readRemaining();
      //console.warn(this.type() + ".readXhrLines() newText: ", newText);
      if (newText) {
        this.jsonStreamReader().onStreamJson(newText);
      } else {
      }
    } catch (error) {
      this.onError(error);
      this.xhrPromise().callRejectFunc(new Error(error));      
    }
  }

  onJsonStreamReaderError (reader, error) {
    this.setError(error);
    this.abort();
  }

  onJsonStreamReaderPopContainer (reader, json) {
    throw new Error(this.type() + " onJsonStreamReaderPopContainer(reader, json) should be overridden by subclass");
  }


}).initThisClass();
