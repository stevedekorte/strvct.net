"use strict";

/* 
    HomeAssistantDevice


   HomeAssistantDevice:{
  "area_id": null,
  "configuration_url": null,
  "config_entries": [
    "a8bc13c525dbdcf6e0bbcd6b8693dadc"
  ],
  "connections": [],
  "disabled_by": null,
  "entry_type": "service",
  "hw_version": null,
  "id": "6cdcb91bb251ccd6ba6828d4b56c761b",
  "identifiers": [
    [
      "sun",
      "a8bc13c525dbdcf6e0bbcd6b8693dadc"
    ]
  ],
  "manufacturer": null,
  "model": null,
  "name_by_user": null,
  "name": "Sun",
  "serial_number": null,
  "sw_version": null,
  "via_device_id": null
}

*/

(class HomeAssistantDevice extends HomeAssistantObject {
  initPrototypeSlots() {

  }

  init() {
    super.init();
  }
  
  finalInit () {
    super.finalInit();
    this.setNodeCanEditTitle(true);
  }

  entitiesNode () {
    return this;
  }

  /*
  updateSubtitle () {
    const s = [
      this.entitiesNode().subnodeCount() + " entities",
      this.statesCount() + " states"
    ].join("\n");
    this.setSubtitle(s);
    return this;
  }
  */

  id () {
    return this.haJson().id;
  }

  areaId () {
    return this.haJson().area_id;
  }

  ownerId () {
    return this.areaId();
  }

  ownerGroup () {
    return this.homeAssistant().areasNode();
  }

  updateTitles () {
    let name = this.haJson().name_by_user;
    if (!name) {
      name = this.haJson().name;
    }
    if (name === null) {
      name = "NULL";
    }
    //    this.removeAllSubnodes();
    this.setName(name);
    this.setTitle(this.computeShortName());

    if (this.state()) {
      this.setSubtitle(this.state());
    }
    //this.updateSubtitle();
  }

  state () {
    if (this.subnodesCount() === 1) {
      return this.subnodes().first().state();
    }
    return undefined;
  }

  addEntity (entity) {
    entity.removeFromParentNode();
    this.entitiesNode().addSubnode(entity);
    return this;
  }

}).initThisClass();
