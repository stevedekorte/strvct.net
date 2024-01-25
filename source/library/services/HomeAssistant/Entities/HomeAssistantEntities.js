"use strict";

/* 
    HomeAssistantEntities

*/

(class HomeAssistantEntities extends HomeAssistantGroup {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("entities");
    this.setSubnodeClasses([HomeAssistantEntity]);
  }

  finalInit() {
    super.finalInit()
  }

  firstSubnodeClass () {
    return this.subnodeClasses().first();
  }

  setHaJson (json) {
    this.removeAllSubnodes();
    json.forEach(snJson => {
      const node = this.subnodeClasses().first().clone();
      node.setHaJson(snJson);
      this.addSubnode(node);
    });
    return this;
  }

  completeSetup () {
    this.subnodes().forEach(sn => sn.completeSetup());
    return this;
  }


}.initThisClass());
