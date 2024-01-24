"use strict";

/* 
    HomeAssistantStates

*/

(class HomeAssistantStates extends HomeAssistantGroup {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("states");
  }

  finalInit() {
    super.finalInit()
  }

  /*
  statesForDevice (device) {
    return this.subnodes().filter(state => state.deviceId() === device.id())
  }
  */

}.initThisClass());
