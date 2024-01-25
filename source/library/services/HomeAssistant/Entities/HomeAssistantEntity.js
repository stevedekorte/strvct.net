"use strict";

/* 
    HomeAssistantEntity

  
    {
  "area_id": null,
  "config_entry_id": "0c5f8e74567b2b5ed23bff95c748fd73",
  "device_id": "fde6bc1b7ab8ddb70724c217783eb2e6",
  "disabled_by": null,
  "entity_category": "config",
  "entity_id": "switch.deck_speakers_surround_music_full_volume",
  "has_entity_name": true,
  "hidden_by": null,
  "icon": null,
  "id": "7d631fa422dc59846bf5bd201bed8e30",
  "name": null,
  "options": {
    "conversation": {
      "should_expose": false
    }
  },
  "original_name": "Surround music full volume",
  "platform": "sonos",
  "translation_key": "surround_mode",
  "unique_id": "RINCON_C438755F9BC701400-surround_mode"
}

*/

(class HomeAssistantEntity extends HomeAssistantObject {
  initPrototypeSlots() {
    {
      const slot = this.newSlot("device", null);
    }

    {
      const slot = this.newSlot("statesNode", null)
      slot.setFinalInitProto(HomeAssistantStates);
      slot.setShouldStoreSlot(false);
      slot.setIsSubnode(true);
    }


    /*
    {
      const slot = this.newSlot("scanAction", null);
      //slot.setInspectorPath("Character");
      slot.setLabel("Scan");
      slot.setSyncsToView(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Action");
      slot.setIsSubnodeField(true);
      slot.setCanInspect(true)
      slot.setActionMethodName("scan");
    }
    */
  }

  init() {
    super.init();
    this.setTitle("");
    this.setCanDelete(true);
  }

  /*
  subtitle () {
    return "Entity";
  }
  */
  
  finalInit () {
    super.finalInit();
    this.statesNode().setTitle("states");
  }

  didUpdateSlotHaJson (oldValue, newValue) {
    const json = newValue;
    this.setTitle(json.entity_id);
    this.setSubtitle(json.device_id);
    //console.log(this.type() + ":" + JSON.stringify(newValue, 2, 2));
    return this;
  }

  areaId () {
    return this.haJson().area_id;
  }

  deviceId () {
    return this.haJson().device_id;
  }

  id () {
    return this.haJson().entity_id;
  }

  subtitle () {
    return this.statesCount() + " states";
  }

  statesCount () {
    return this.statesNode().subnodeCount();
  }

  findDevice () {
    const entity = this.homeAssistant().deviceWithId(this.deviceId());
    return entity;
  }

  completeSetup () {
    const json = this.haJson();
    this.setTitle(json.entity_id);
    this.setSubtitle(json.device_id);
    
    const device = this.findDevice();
    if (device) {
      this.setDevice(device);
      this.device().addEntity(this);
      console.warn("entity " + this.id() + " found device with id " + this.deviceId())
    } else {
      console.warn("entity " + this.id() + " unable to find device with id " + this.deviceId())
    }
    return this;
  }

  addState (state) {
    state.removeFromParentNode();
    this.statesNode().addSubnode(state);
  }

  /*
  scanActionInfo () {
    return {
        isEnabled: this.hasValidUrl(),
        //title: this.title(),
        subtitle: this.hasValidUrl() ? null : "Invalid Host URL",
        isVisible: true
    }
  }
  */

}).initThisClass();
