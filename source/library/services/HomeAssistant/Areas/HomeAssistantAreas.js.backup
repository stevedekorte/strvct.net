"use strict";

/* 
    HomeAssistantAreas

*/

(class HomeAssistantAreas extends HomeAssistantGroup {
  initPrototypeSlots () {
  }

  init() {
    super.init();
    this.setTitle("areas");
    this.setSubnodeClasses([HomeAssistantArea]);
  }

  finalInit() {
    super.finalInit();
    this.setGetMessageType("config/area_registry/list");
  }

  completeSetup () {
    super.completeSetup();
    
    const root = this.homeAssistant().rootFolder();
    root.removeAllSubnodes();
    root.addSubnodes(this.haObjects());
  }

}.initThisClass());
