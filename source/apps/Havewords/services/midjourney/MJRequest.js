"use strict";

/* 
    MJRequest

    Wrapper for API request

*/

(class MJRequest extends Base {
  initPrototypeSlots () {
    this.newSlot("endpointPath", null);
    this.newSlot("service", null)
    this.newSlot("body", null); // JSON object
    this.newSlot("startTime", null); // JSON object
    this.newSlot("timeoutMs", 120000); 
    this.newSlot("timeoutId", null); 
  }

  init () {
    super.init();
    this.setService(MJService.shared());
    this.setIsDebugging(false)
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
      throw new Error(this.type() + " service missing");
    }

    if (!this.service().apiKey()) {
      throw new Error(this.type() + " apiKey missing");
    }

    if (!this.service().apiBaseUrl()) {
      throw new Error(this.type() + " apiBaseUrl missing");
    }
  }
  
  async asyncSend () {
    this.setStartTime(new Date().getTime());
    this.assertValid()

    const requestOptions = this.requestOptions()

    this.debugLog(" send request endpointUrl:" +  this.endpointUrl() + "options: \n", requestOptions);

    const fetchPromise = fetch(this.endpointUrl(), requestOptions);
    const timeoutPromise = this.newTimeoutPromise();

    return Promise.race([timeoutPromise, fetchPromise])
      .then(response => {
        this.clearTimeout();
        return response.json();
      })
      .catch(error => {
          throw new Error("request timeout after " + this.timeoutMs() + "ms");
      });
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

}.initThisClass());


