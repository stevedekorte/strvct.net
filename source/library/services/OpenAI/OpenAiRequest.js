"use strict";

/* 
    OpenAiRequest


*/

(class OpenAiRequest extends AiRequest {

  initPrototypeSlots() {

  }

  init () {
    super.init();
    this.setIsDebugging(true);
  }

  apiKey () {
    return OpenAiService.shared().apiKey();
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

   // --- streaming ---

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
              const errorFinishReasons = ["length", "stop"];
              if (errorFinishReasons.includes(this.finishReason())) {
                this.setError("finish reason: '" + this.finishReason() + "'");
              }
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
    } catch (error) {
      this.onError(error);
      console.warn(this.type() + " ERROR:", error);
      this.xhrPromise().callRejectFunc(new Error(error));      
    }
  }

  onStreamJsonChunk (json) {
    if (json.error) {
      console.warn("ERROR: " + json.error.message);
      this.xhrPromise().callRejectFunc(new Error(json.error.message));
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
        this.setFinishReason(json.choices[0].finish_reason);
    } else {
      if (json.id) {
        //console.warn("HEADER: ", JSON.stringify(json));
        // this is the header chunk - do we need to keep this around?
      } else {
        console.warn("WARNING: don't know what to do with this JsonChunk", json);
      }
    }
  }

}).initThisClass();
