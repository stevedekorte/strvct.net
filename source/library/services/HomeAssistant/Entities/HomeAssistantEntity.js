/**
 * @module library.services.HomeAssistant.Entities
 */

"use strict";

/**
 * @class HomeAssistantEntity
 * @extends HomeAssistantObject
 * @classdesc Represents a Home Assistant entity.
 * 
 * Example JSON structure:
 * {
 *   "area_id": null,
 *   "config_entry_id": "0c5f8e74567b2b5ed23bff95c748fd73",
 *   "device_id": "fde6bc1b7ab8ddb70724c217783eb2e6",
 *   "disabled_by": null,
 *   "entity_category": "config",
 *   "entity_id": "switch.deck_speakers_surround_music_full_volume",
 *   "has_entity_name": true,
 *   "hidden_by": null,
 *   "icon": null,
 *   "id": "7d631fa422dc59846bf5bd201bed8e30",
 *   "name": null,
 *   "options": {
 *     "conversation": {
 *       "should_expose": false
 *     }
 *   },
 *   "original_name": "Surround music full volume",
 *   "platform": "sonos",
 *   "translation_key": "surround_mode",
 *   "unique_id": "RINCON_C438755F9BC701400-surround_mode"
 * }
 */
(class HomeAssistantEntity extends HomeAssistantObject {
  /**
   * @description Initializes prototype slots for the HomeAssistantEntity.

   */
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

  /**
   * @description Initializes the HomeAssistantEntity.

   */
  init() {
    super.init();
    this.setTitle("");
    this.setCanDelete(true);
  }

  /**
   * @description Performs final initialization steps for the HomeAssistantEntity.

   */
  finalInit () {
    super.finalInit();
    this.setNodeSubtitleIsChildrenSummary(true);
  }

  /**
   * @description Gets the area ID of the entity.

   * @returns {string|null} The area ID.
   */
  areaId () {
    return this.haJson().area_id;
  }

  /**
   * @description Gets the device ID of the entity.

   * @returns {string} The device ID.
   */
  deviceId () {
    return this.haJson().device_id;
  }

  /**
   * @description Gets the entity ID.

   * @returns {string} The entity ID.
   */
  id () {
    return this.haJson().entity_id;
  }

  /**
   * @description Gets the states node of the entity.

   * @returns {Object} The states node.
   */
  statesNode () {
    return this;
  }

  /**
   * @description Gets the count of states for the entity.

   * @returns {number} The number of states.
   */
  statesCount () {
    return this.statesNode().subnodeCount();
  }

  /**
   * @description Gets the owner ID of the entity.

   * @returns {string} The owner ID.
   */
  ownerId () {
    return this.deviceId();
  }

  /**
   * @description Gets the owner group of the entity.

   * @returns {Object} The owner group.
   */
  ownerGroup () {
    return this.homeAssistant().devicesNode();
  }

  /**
   * @description Updates the titles of the entity.

   */
  updateTitles () {
    const json = this.haJson();
    this.updateName();
    this.setTitle(this.computeShortName());
    this.setSubtitle("entiy");

    if (this.state()) {
      this.setSubtitle(this.state());
    }
  }

  /**
   * @description Gets the state of the entity.

   * @returns {*} The state of the entity.
   */
  state () {
    if (this.subnodesCount() === 1) {
      return this.subnodes().first().state();
    }
    return undefined;
  }

  /**
   * @description Updates the name of the entity.

   * @returns {HomeAssistantEntity} The current instance.
   */
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