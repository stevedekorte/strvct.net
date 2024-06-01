"use strict";

/* 
    HomeAssistantEntities

*/

(class HomeAssistantEntities extends HomeAssistantGroup {
  initPrototypeSlots () {

  }

  init() {
    super.init();
    this.setTitle("entities");
    this.setSubnodeClasses([HomeAssistantEntity]);
  }

  finalInit() {
    super.finalInit();
    this.setGetMessageType("config/entity_registry/list");
  }

}.initThisClass());
