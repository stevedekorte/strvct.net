/**
* @module library.services.HomeAssistant.Devices
*/

/**
* @class HomeAssistantDevice
* @extends HomeAssistantObject
* @classdesc Represents a Home Assistant device.
*
* HomeAssistantDevice:{
*   "area_id": null,
*   "configuration_url": null,
*   "config_entries": [
*     "a8bc13c525dbdcf6e0bbcd6b8693dadc"
*   ],
*   "connections": [],
*   "disabled_by": null,
*   "entry_type": "service",
*   "hw_version": null,
*   "id": "6cdcb91bb251ccd6ba6828d4b56c761b",
*   "identifiers": [
*     [
*       "sun",
*       "a8bc13c525dbdcf6e0bbcd6b8693dadc"
*     ]
*   ],
*   "manufacturer": null,
*   "model": null,
*   "name_by_user": null,
*   "name": "Sun",
*   "serial_number": null,
*   "sw_version": null,
*   "via_device_id": null
* }
*/
"use strict";

(class HomeAssistantDevice extends HomeAssistantObject {
    /**
    * @description Initializes prototype slots.
    * @category Initialization
    */
    initPrototypeSlots () {

    }

    /**
    * @description Initializes the HomeAssistantDevice.
    * @category Initialization
    */
    init () {
        super.init();
    }

    /**
    * @description Performs final initialization.
    * @category Initialization
    */
    finalInit () {
        super.finalInit();
        this.setNodeCanEditTitle(true);
    }

    /**
    * @description Returns the entities node.
    * @returns {HomeAssistantDevice} The current device instance.
    * @category Data Access
    */
    entitiesNode () {
        return this;
    }

    /**
    * @description Returns the device ID.
    * @returns {string} The device ID.
    * @category Data Access
    */
    id () {
        return this.haJson().id;
    }

    /**
    * @description Returns the area ID.
    * @returns {string|null} The area ID.
    * @category Data Access
    */
    areaId () {
        return this.haJson().area_id;
    }

    /**
    * @description Returns the owner ID.
    * @returns {string|null} The owner ID.
    * @category Data Access
    */
    ownerId () {
        return this.areaId();
    }

    /**
    * @description Returns the owner group.
    * @returns {Object} The areas node of the Home Assistant instance.
    * @category Data Access
    */
    ownerGroup () {
        return this.homeAssistant().areasNode();
    }

    /**
    * @description Updates the titles of the device.
    * @category UI
    */
    updateTitles () {
        let name = this.haJson().name_by_user;
        if (!name) {
            name = this.haJson().name;
        }
        if (name === null) {
            name = "NULL";
        }
        this.setName(name);
        this.setTitle(this.computeShortName());

        if (this.state()) {
            this.setSubtitle(this.state());
        }
    }

    /**
    * @description Returns the state of the device.
    * @returns {string|undefined} The state of the device.
    * @category Data Access
    */
    state () {
        if (this.subnodesCount() === 1) {
            return this.subnodes().first().state();
        }
        return undefined;
    }

    /**
    * @description Adds an entity to the device.
    * @param {Object} entity - The entity to add.
    * @returns {HomeAssistantDevice} The current device instance.
    * @category Data Manipulation
    */
    addEntity (entity) {
        entity.removeFromParentNode();
        this.entitiesNode().addSubnode(entity);
        return this;
    }

}).initThisClass();
