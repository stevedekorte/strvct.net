"use strict";

/* 
    Services.js

    A Service (e.g OpenAiService, MJImageService) is used to create Job's.
    It may manage one or more set of job types. 
    Each job type is managed via a Jobs instance.

*/

(class Services extends Base {
  initPrototypeSlots() {
    this.newSlot("serviceClasses", null);
  }

  init () {
    super.init();
    this.setServiceClasses(new Set());
    return this;
  }

  setupServiceClasses() {
    this.addServiceClass(OpenAiService);
    this.addServiceClass(MJService);
    return this
  }

  addServiceClass (aClass) {
    this.serviceClasses().add(aClass);
    return this
  }

  services () {
    return this.serviceClasses().map(aClass => aClass.shared());
  }

  abortAll () {
    this.services().forEach(service => {
      service.abortAllJobs();
    })
  }

}).initThisClass();
