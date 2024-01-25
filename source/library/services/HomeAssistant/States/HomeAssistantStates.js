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
    this.setSubnodeClasses([HomeAssistantState]);
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
