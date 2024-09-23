"use strict";

/* 
    HomeAssistantStates

*/

(class HomeAssistantStates extends HomeAssistantGroup {
  initPrototypeSlots () {

  }

  init() {
    super.init();
    this.setTitle("states");
    this.setSubnodeClasses([HomeAssistantState]);
  }

  finalInit() {
    super.finalInit();
    this.setGetMessageType("get_states");
    this.setNodeSubtitleIsChildrenSummary(false);
  }

}.initThisClass());
