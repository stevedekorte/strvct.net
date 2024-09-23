"use strict";

/* 
    HomeAssistantGroup

*/

(class HomeAssistantGroup extends BMSummaryNode {

  initPrototypeSlots () {
    {
      const slot = this.newSlot("homeAssistant", null);
      slot.setSlotType("HomeAssistant");
    }

    {
      const slot = this.newSlot("getMessageType", null);
      slot.setSlotType("String");
    }

    {
      const slot = this.newSlot("idMap", null);
      slot.setSlotType("Map");
    }

    this.setTitle("devices");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    //this.setSubnodeClasses([HomeAssistantDevice]);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setNoteIsSubnodeCount(true);
  }

  init() {
    super.init();
    this.setIdMap(new Map());
  }

  finalInit () {
    super.finalInit();
    this.makeSortSubnodesByTitle();
  }

  objectWithId (id) {
    return this.idMap().get(id);
  }

  defaultSubnodeClass () {
    return this.subnodeClasses().first();
  }

  groupName () {
    return this.type().after("HomeAssistant");
  }

  async asyncRefresh () {
    this.removeAllSubnodes();

    const s = "refreshing " + this.groupName() + "s...";
    console.log(s);
    this.homeAssistant().setStatus(s);

    const json = await this.homeAssistant().asyncSendMessageDict({ type: this.getMessageType() });
    this.setHaJson(json);
    this.connectObjects();
    //this.completeSetup();
  }

  setHaJson (json) {
    this.removeAllSubnodes();
    json.forEach(snJson => {
      const node = this.defaultSubnodeClass().clone();
      node.setHaJson(snJson);
      node.setGroup(this);
      this.idMap().set(node.id(), node);
      this.addLinkSubnode(node);
    });
    return this;
  }

  haObjects () {
    return this.idMap().valuesArray();
  }

  connectObjects () {
    this.haObjects().shallowCopy().forEach(sn => sn.connectObjects());
    return this;
  }

  completeSetup () {
    this.haObjects().shallowCopy().forEach(sn => sn.completeSetup());
    return this;
  }

  subnodeWithId (id) {
    throw new Error("shouldn't use this");
    //const ids = this.subnodes().map(sn => sn.id());
    return this.subnodes().detect(sn => sn.id() === id);
  }

}.initThisClass());
