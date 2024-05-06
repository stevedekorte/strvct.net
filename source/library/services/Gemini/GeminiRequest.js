"use strict";

/* 
    GeminiRequest

    Example CURL request:

  curl -X POST \
      -H "Authorization: Bearer $(gcloud auth print-access-token)" \
      -H "Content-Type: application/json; charset=utf-8" \
      -d @request.json \
      "https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/us-central1/publishers/google/models/gemini-1.0-pro:streamGenerateContent?alt=sse"

  Example request body JSON:

    {
      "contents": {
        "role": "ROLE",
        "parts": { "text": "TEXT" }
      },
      "system_instruction":
      {
        "parts": [
          {
            "text": "SYSTEM_INSTRUCTION"
          }
        ]
      },
      "safety_settings": {
        "category": "SAFETY_CATEGORY",
        "threshold": "THRESHOLD"
      },
      "generation_config": {
        "temperature": TEMPERATURE,
        "topP": TOP_P,
        "topK": TOP_K,
        "candidateCount": 1,
        "maxOutputTokens": MAX_OUTPUT_TOKENS,
        "stopSequences": STOP_SEQUENCES,
      }
    }

*/

(class GeminiRequest extends AiRequest { 

  initPrototypeSlots() {
    {
      const slot = this.newSlot("jsonStreamReader", null);
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

  apiKey () {
    return GeminiService.shared().apiKey();
  }

  setupForStreaming () {
    return this;
  }

  requestOptions () {
    const apiKey = this.apiKey();
    return {
      method: "POST",
      headers: {
        //"Content-Type": "application/json",
        "Content-Type": "application/json; charset=utf-8",
        'Accept-Encoding': 'identity'
      },
      body: JSON.stringify(this.bodyJson())
    };
  }

   // --- streaming ---

  async asyncSendAndStreamResponse () {
    if (!this.isContinuation()) {
      this.jsonStreamReader().beginJsonStream();
    }
    return super.asyncSendAndStreamResponse();
  }
    /*

   // NOTE: the data dictionary is all on one line, but I've broken it up here for readability

   data: {
   "candidates":[
      {
         "content":{
            "role":"model",
            "parts":[
               {
                  "text":"Avast there, landlubber! Ye be mistaken. I be but a"
               }
            ]
         },
         "safetyRatings":[
            {
               "category":"HARM_CATEGORY_HARASSMENT",
               "probability":"LOW"
            },
            {
               "category":"HARM_CATEGORY_HATE_SPEECH",
               "probability":"NEGLIGIBLE"
            },
            {
               "category":"HARM_CATEGORY_SEXUALLY_EXPLICIT",
               "probability":"NEGLIGIBLE"
            },
            {
               "category":"HARM_CATEGORY_DANGEROUS_CONTENT",
               "probability":"NEGLIGIBLE"
            }
         ]
      }
   ]
}

   */

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

  stoppedDueToMaxTokens () {
    return false; // stopped due to max output tokens per request
  }


  onJsonStreamReaderError (reader, error) {
    this.setError(error);
    this.abort();
  }

  onJsonStreamReaderPopContainer (reader, json) {
    if (reader.containerStack().length === 2) {
      this.onStreamJsonChunk(json);
    }
  }

  onStreamJsonChunk (json) {

    /*
      example json:
      
      {
        "content":{
        "role":"model",
        "parts":[
            {
              "text":"Avast there, landlubber! Ye be mistaken. I be but a"
            }
        ]
      }


      data: {
        "candidates":[
            {
              "content":{
                  "role":"model",
                  "parts":[
                    {
                        "text":". I be no real-life pirate, but I be mighty good at pretendin'!"
                    }
                  ]
              },
              "finishReason":"STOP",
              "safetyRatings":[
                  {
                    "category":"HARM_CATEGORY_HARASSMENT",
                    "probability":"NEGLIGIBLE"
                  },
                  {
                    "category":"HARM_CATEGORY_HATE_SPEECH",
                    "probability":"NEGLIGIBLE"
                  },
                  {
                    "category":"HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "probability":"NEGLIGIBLE"
                  },
                  {
                    "category":"HARM_CATEGORY_DANGEROUS_CONTENT",
                    "probability":"NEGLIGIBLE"
                  }
              ]
            }
        ],
        "usageMetadata":{
            "promptTokenCount":23,
            "candidatesTokenCount":50,
            "totalTokenCount":73
        }
      }

  */

    const candidates = json.candidates;

    if (candidates) {
      const candidate = candidates[0];
      if (candidate.content) {
        const text = candidate.content.parts[0].text;
        this.onNewContent(text);
      }

      if (candidate.finishReason) {
        if (candidate.finishReason !== "STOP") {
          console.warn("finishReason: ", candidate.finishReason);
          this.setStopReason(candidates.finishReason);
        }
      }

      if (candidate.safetyRatings) {
        console.log("candidate.safetyRatings: ", candidate.safetyRatings);
      }
    }

    if (json.usageMetadata) {
      this.setUsageOutputTokenCount(json.usageMetadata.totalTokenCount);
    }
  }

  stopReasonDict () {
    return {
      "FINISH_REASON_UNSPECIFIED": "Default value. This value is unused.",
      "STOP": "Natural stop point of the model or provided stop sequence.",
      "MAX_TOKENS": "The maximum number of tokens as specified in the request was reached.",
      "SAFETY": "The candidate content was flagged for safety reasons.",
      "RECITATION": "The candidate content was flagged for recitation reasons.",
      "OTHER": "Unknown reason."
    }
  }

  stoppedDueToMaxTokens () {
    return this.stopReason() === "MAX_TOKENS";
  }

}).initThisClass();
