"use strict";

/* 
    HomeAssistantDevices

*/

(class HomeAssistantDevices extends HomeAssistantGroup {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("devices");
    this.setSubnodeClasses([HomeAssistantDevice]);
  }

  finalInit() {
    super.finalInit()
  }


}.initThisClass());
