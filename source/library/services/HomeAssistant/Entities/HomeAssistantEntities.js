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

  entityWithId (id) {
    //const deviceEntities = this.entities().filter(entity => deviceEntityIds.includes(entity.entity_id));
    return this.subnodes().detect(entity => entity.entityId() === id);
  }

  completeSetup () {
    this.subnodes().forEach(sn => sn.completeSetup());
    return this;
  }


}.initThisClass());
