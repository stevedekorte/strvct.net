"use strict";

/* 
    HomeAssistantEntities

*/

(class HomeAssistantEntities extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("entities");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([HomeAssistantEntity]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
  }

  /*
  didInit () {
    super.didInit()
  }
  */

  /*
  service () {
    return this.parentNode()
  }
  */

  setEntitiesJson (entitiesJson) {

    return this;
  }

}.initThisClass());
