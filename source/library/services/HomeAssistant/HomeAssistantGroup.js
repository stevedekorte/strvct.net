"use strict";

/* 
    HomeAssistantGroup

*/

(class HomeAssistantGroup extends BMSummaryNode {
  initPrototypeSlots() {

  }

  init() {
    super.init();
    this.setTitle("devices");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    //this.setSubnodeClasses([HomeAssistantDevice]);
    this.setCanAdd(true);
    this.setNodeCanReorderSubnodes(true);
  }

  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
    this.makeSortSubnodesByTitle();
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

  defaultSubnodeClass () {
    return this.subnodeClasses().first();
  }

  setHaJson (json) {
    this.removeAllSubnodes();
    json.forEach(snJson => {
      const node = this.defaultSubnodeClass().clone();
      node.setHaJson(snJson);
      this.addSubnode(node);
    });
    return this;
  }

  homeAssistant () {
    return this.parentNode();
  }

  completeSetup () {
    this.subnodes().shallowCopy().forEach(sn => sn.completeSetup());
    return this;
  }

  subnodeWithId (id) {
    //const ids = this.subnodes().map(sn => sn.id());
    return this.subnodes().detect(sn => sn.id() === id);
  }

}.initThisClass());
