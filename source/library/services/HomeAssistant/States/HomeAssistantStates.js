/**
  * @module library.services.HomeAssistant.States
  */

/**
  * @class HomeAssistantStates
  * @extends HomeAssistantGroup
  * @classdesc Represents a collection of Home Assistant states.
  */
(class HomeAssistantStates extends HomeAssistantGroup {
    /**
      * @description Initializes the prototype slots for the class.
      * @category Initialization
      */
    initPrototypeSlots () {

    }

    /**
      * @description Initializes the HomeAssistantStates instance.
      * @category Initialization
      */
    init () {
        super.init();
        this.setTitle("states");
        this.setSubnodeClasses([HomeAssistantState]);
    }

    /**
      * @description Performs final initialization steps for the HomeAssistantStates instance.
      * @category Initialization
      */
    finalInit () {
        super.finalInit();
        this.setGetMessageType("get_states");
        this.setNodeSubtitleIsChildrenSummary(false);
    }

}.initThisClass());