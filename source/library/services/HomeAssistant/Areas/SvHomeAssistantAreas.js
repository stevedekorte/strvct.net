/**
  * @module library.services.SvHomeAssistant.Areas
  */

/**
  * @class SvHomeAssistantAreas
  * @extends SvHomeAssistantGroup
  * @classdesc Represents a collection of Home Assistant areas.
  */
(class SvHomeAssistantAreas extends SvHomeAssistantGroup {
    /**
      * @description Initializes prototype slots for the class.
      * @category Initialization
      */
    initPrototypeSlots () {
    }

    /**
      * @description Initializes the SvHomeAssistantAreas instance.
      * @category Initialization
      */
    init () {
        super.init();
        this.setTitle("areas");
        this.setSubnodeClasses([SvHomeAssistantArea]);
    }

    /**
      * @description Performs final initialization steps.
      * @category Initialization
      */
    finalInit () {
        super.finalInit();
        this.setGetMessageType("config/area_registry/list");
    }

    /**
      * @description Completes the setup process for the SvHomeAssistantAreas instance.
      * @category Setup
      */
    completeSetup () {
        super.completeSetup();

        const root = this.homeAssistant().rootFolder();
        root.removeAllSubnodes();
        root.addSubnodes(this.haObjects());
    }

}.initThisClass());
