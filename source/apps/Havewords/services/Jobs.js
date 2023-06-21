"use strict";

/* 
    Jobs.js

    A class to manager network job requests.
    Useful for tracking and aborting jobs if needed.

*/

(class Jobs extends Base {
  initPrototypeSlots() {
    this.newSlot("jobsSet", null);
    this.newSlot("jobClass", null);
  }

  init () {
    super.init();
    this.setJobsSet(new Set());
    return this;
  }

  newJob () {
    const job = this.jobClass().clone();
    job.setManager(this);
    this.jobsSet().add(job);
    return job;
  }

  endJob (aJob) {
    this.jobsSet().delete(aJob);
    return this;
  }

  abortAll () {
    this.jobsSet().forEach(job => {
      job.abort();
    })
  }

}).initThisClass();
