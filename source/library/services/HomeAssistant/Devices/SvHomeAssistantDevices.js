/**
  * @module library.services.SvHomeAssistant.SvDevices
  */

/**
  * @class SvHomeAssistantDevices
  * @extends SvHomeAssistantGroup
  * @classdesc Represents a group of SvHomeAssistant devices.
  */
(class SvHomeAssistantDevices extends SvHomeAssistantGroup {
    /**
      * @description Initializes the prototype slots for the class.
      * @category Initialization
      */
    initPrototypeSlots () {

    }

    /**
      * @description Initializes the SvHomeAssistantDevices instance.
      * @category Initialization
      */
    init () {
        super.init();
        this.setTitle("devices");
        this.setSubnodeClasses([SvHomeAssistantDevice]);
    }

    /**
      * @description Performs final initialization steps for the SvHomeAssistantDevices instance.
      * @category Initialization
      */
    finalInit () {
        super.finalInit();
        this.setGetMessageType("config/device_registry/list");
    }


}.initThisClass());
