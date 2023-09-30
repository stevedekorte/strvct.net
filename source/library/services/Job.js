"use strict";

/* 
    Job.js

    An abstraction for what is typically one or more network requests.
    These are assumed to be one shot (the object is not reused).

*/

(class Job extends BMSummaryNode {
  initPrototypeSlots() {
    {
      const slot = this.newSlot("manager", null);
      slot.setInspectorPath("Job")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setCanEditInspection(false)
      slot.setSummaryFormat("none")
    }
     
    {
      const slot = this.newSlot("requestId", null); 
      slot.setInspectorPath("Job")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setCanEditInspection(false)
      //slot.setIsSubnodeField(true)
      slot.setSummaryFormat("none")
    }

    {
      const slot = this.newSlot("startDate", null);
      slot.setInspectorPath("Job")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setCanEditInspection(false)
      //slot.setIsSubnodeField(true)
      slot.setSummaryFormat("none")
    }

    {
      const slot = this.newSlot("endDate", null);
      slot.setInspectorPath("Job")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setCanEditInspection(false)
      //slot.setIsSubnodeField(true)
      slot.setSummaryFormat("none")
    }

    /*
    {
      const slot = this.newSlot("timeoutInMs", null);
      slot.setInspectorPath("job")
      slot.setShouldStoreSlot(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setIsSubnodeField(true)
    }
   */

    {
      const slot = this.newSlot("progress", null);
      slot.setInspectorPath("Job")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Number")
      slot.setCanEditInspection(false)
      //slot.setIsSubnodeField(true)
      slot.setSummaryFormat("none")
    }

    {
      const slot = this.newSlot("status", null); 
      slot.setInspectorPath("Job")
      slot.setShouldStoreSlot(true)
      slot.setSyncsToView(true)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("String")
      slot.setCanEditInspection(false)
      //slot.setIsSubnodeField(true)
      slot.setInitValue("not started")
      slot.setSummaryFormat("value")
    }

    {
      const slot = this.newSlot("error", null); 
    }
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
    if (this.manager()) {
      this.manager().endJob(this);
    }
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
