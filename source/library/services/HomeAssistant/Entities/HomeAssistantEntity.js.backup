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
  initPrototypeSlots () {

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

  
  finalInit () {
    super.finalInit();
    this.setNodeSubtitleIsChildrenSummary(true);
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

  statesNode () {
    return this;
  }

  statesCount () {
    return this.statesNode().subnodeCount();
  }

  ownerId () {
    return this.deviceId();
  }

  ownerGroup () {
    return this.homeAssistant().devicesNode();
  }

  updateTitles () {
    const json = this.haJson();
    this.updateName();
    this.setTitle(this.computeShortName());
    this.setSubtitle("entiy");

    if (this.state()) {
      this.setSubtitle(this.state());
    }
  }

  state () {
    if (this.subnodesCount() === 1) {
      return this.subnodes().first().state();
    }
    return undefined;
  }

  updateName () {
    const json = this.haJson();
    let name = json.original_name;
    if (!name) {
      name = json.entity_id;
    }
    this.setName(name);
    return this;
  }

  /*
  updateSubtitle () {
    if (this.statesCount() === 1) {
      const s = this.statesNode().subnodes().first().state();
      this.setSubtitle(s);
    } else {
      const s = [this.id(), this.statesCount() + " states"].join("\n");
      this.setSubtitle(s);
    }
    return this;
  }

  addState (state) {
    state.removeFromParentNode();
    this.statesNode().addSubnode(state);
    return this;
  }

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
