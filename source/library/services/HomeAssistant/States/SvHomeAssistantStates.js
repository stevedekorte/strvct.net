/**
  * @module library.services.SvHomeAssistant.States
  */

/**
  * @class SvHomeAssistantStates
  * @extends SvHomeAssistantGroup
  * @classdesc Represents a collection of Home Assistant states.
  */
(class SvHomeAssistantStates extends SvHomeAssistantGroup {
    /**
      * @description Initializes the prototype slots for the class.
      * @category Initialization
      */
    initPrototypeSlots () {

    }

    /**
      * @description Initializes the SvHomeAssistantStates instance.
      * @category Initialization
      */
    init () {
        super.init();
        this.setTitle("states");
        this.setSubnodeClasses([SvHomeAssistantState]);
    }

    /**
      * @description Performs final initialization steps for the SvHomeAssistantStates instance.
      * @category Initialization
      */
    finalInit () {
        super.finalInit();
        this.setGetMessageType("get_states");
        this.setNodeSubtitleIsChildrenSummary(false);
    }

}.initThisClass());
