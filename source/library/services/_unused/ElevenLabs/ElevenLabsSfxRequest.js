"use strict";

/* 
    ElevenLabsSfxRequest


    curl --request POST \
      --url https://api.elevenlabs.io/v1/sound-generation \
      --header 'Content-Type: application/json' \
      --data '{
      "text": "<string>",
      "duration_seconds": 123,
      "prompt_influence": 123
    }'

    response: 200 - audio/mpeg

*/

(class ElevenLabsSfxRequest extends BMSummaryNode {

  initPrototypeSlots () {
    {
      const slot = this.newSlot("apiUrl", " https://api.elevenlabs.io/v1/sound-generation");
      slot.setInspectorPath("")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setIsSubnodeField(true)
      slot.setCanEditInspection(false)
    }

    {
      const slot = this.newSlot("text", 0);
    }

    {
      const slot = this.newSlot("duration_seconds", "None");
      slot.setMinValue(0.5);
      slot.setMaxValue(22);
    }

    {
      const slot = this.newSlot("prompt_influence", 0.3); // "messages-2023-12-15"
      slot.setMinValue(0);
      slot.setMaxValue(1);
    }

  }

  init () {
    super.init();
    this.setIsDebugging(true);
  }

  apiKey () {
    return  ElevenLabsService.shared().apiKey();
  }

  requestOptions () {
    const apiKey = this.apiKey();
    const json = {
      method: "POST",
      headers: {
        //"Content-Type": "application/json",
        "Content-Type": "application/json; charset=UTF-8",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
        'Accept-Encoding': 'identity'
      },
      body: JSON.stringify(this.bodyJson()),
    };
    return json;
  }

  bodyJson () {
    return {
      "text": this.text(),
      "duration_seconds": this.duration_seconds(),
      "prompt_influence": this.prompt_influence(),
    };
  }

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
      //const sound = SvWaSound.fromBlob(audioBlob);
      this.sound().asyncLoadFromDataBlob(audioBlob);

      this.sendDelegate("onRequestComplete");

    } catch (error) {
      this.setIsFetchActive(false);
      console.error('Error:', error);
      this.onError(error);
    }
  }

}).initThisClass();
