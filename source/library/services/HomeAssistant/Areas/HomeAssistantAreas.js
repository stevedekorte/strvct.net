"use strict";

/* 
    HomeAssistantAreas

*/

(class HomeAssistantAreas extends HomeAssistantGroup {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setTitle("areas");
    this.setSubnodeClasses([HomeAssistantArea]);
  }

  finalInit() {
    super.finalInit()
  }

  areaWithId (id) {
    return this.subnodes().detect(sn => sn.id() === id);
  }

  areaWithIdCreateIfAbsent (id) {
    let area = this.areaWithId(id);
    if (!area) {
      const areaClass = this.subnodeClasses().first();
      area = areaClass.clone();
      area.setId(id);
      this.addSubnode(area);
    }
    return area;
  }

  addDevices (devices) {
    devices.shallowCopy().forEach(device => this.addDevice(device));
    return this;
  }

  addDevice (device) {
    let aid = device.areaId();
    if (aid) {
      const area = this.areaWithIdCreateIfAbsent(aid);
      area.addDevice(device);
    }
    return this;
  }

}.initThisClass());
