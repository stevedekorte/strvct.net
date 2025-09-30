/**
  * @module library.services.HomeAssistant.Devices
  */

/**
  * @class HomeAssistantDevices
  * @extends HomeAssistantGroup
  * @classdesc Represents a group of HomeAssistant devices.
  */
(class HomeAssistantDevices extends HomeAssistantGroup {
    /**
      * @description Initializes the prototype slots for the class.
      * @category Initialization
      */
    initPrototypeSlots () {

    }

    /**
      * @description Initializes the HomeAssistantDevices instance.
      * @category Initialization
      */
    init () {
        super.init();
        this.setTitle("devices");
        this.setSubnodeClasses([HomeAssistantDevice]);
    }

    /**
      * @description Performs final initialization steps for the HomeAssistantDevices instance.
      * @category Initialization
      */
    finalInit () {
        super.finalInit();
        this.setGetMessageType("config/device_registry/list");
    }


}.initThisClass());
