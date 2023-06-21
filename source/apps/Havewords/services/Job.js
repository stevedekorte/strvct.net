"use strict";

/* 
    Job.js

    An abstraction for what is typically one or more network requests.
    These are assumed to be one shot (the object is not reused).

*/

(class Job extends Base {
  initPrototypeSlots() {
    this.newSlot("manager", null);
    //this.newSlot("jobId", null); 
    this.newSlot("requestId", null); 

    this.newSlot("startDate", null);  
    this.newSlot("endDate", null);
    this.newSlot("timeoutInMs", null);

    this.newSlot("progress", null);
    this.newSlot("status", null); 
    this.newSlot("error", null); 
  }

  init () {
    super.init();
    return this;
  }

  onChange() {
    // subclasses can override
  }

  assertReady () {
    assert(this.manager());
    assert(this.requestId());
  }

  async start() {
    try {
      this.onStart();
      this.assertReady();
      const result = await this.justStart()
      this.onComplete();
      return result;
    } catch (error) {
      this.throwError(error);
    }
  }

  onStart () {
    this.setStartDate(new Date().getTime());
    this.setStatus("started");
    this.setProgress(100);
    this.onChange();
  }

  onComplete () {
    this.setStatus("complete");
    this.setProgress(100);
    this.onChange();
    this.onEnd();
  }

  onEnd () {
    this.setEndDate(new Date().getTime());
    this.manager().endJob(this);
  }

  errorMessage () { 
    const error = this.error();
    return error ? error.message : null;
  }

  timeTaken () { 
    const start = this.startDate();
    return start ? new Date().getTime() - start : 0;
  }

  throwError(error) {
    console.warn(error.message);
    this.setError(error);
    this.setStatus("error: " + error.message);
    this.onChange();
    this.onEnd();
    throw error;
  }

}).initThisClass();
