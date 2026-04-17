/**
  * @module library.services.SvHomeAssistant.Entities
  */

/**
  * @class SvHomeAssistantEntities
  * @extends SvHomeAssistantGroup
  * @classdesc Represents a collection of Home Assistant entities.
  */
(class SvHomeAssistantEntities extends SvHomeAssistantGroup {
    /**
      * @description Initializes the prototype slots for the class.
      * @category Initialization
      */
    initPrototypeSlots () {

    }

    /**
      * @description Initializes the SvHomeAssistantEntities instance.
      * @category Initialization
      */
    init () {
        super.init();
        this.setTitle("entities");
        this.setSubnodeClasses([SvHomeAssistantEntity]);
    }

    /**
      * @description Performs final initialization steps for the SvHomeAssistantEntities instance.
      * @category Initialization
      */
    finalInit () {
        super.finalInit();
        this.setGetMessageType("config/entity_registry/list");
    }

}.initThisClass());
