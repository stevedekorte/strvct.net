/**
 * @module library.services.HomeAssistant.Areas
 */

/**
 * @class HomeAssistantAreas
 * @extends HomeAssistantGroup
 * @classdesc Represents a collection of Home Assistant areas.
 */
(class HomeAssistantAreas extends HomeAssistantGroup {
  /**
   * @description Initializes prototype slots for the class.
   * @category Initialization
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the HomeAssistantAreas instance.
   * @category Initialization
   */
  init() {
    super.init();
    this.setTitle("areas");
    this.setSubnodeClasses([HomeAssistantArea]);
  }

  /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
  finalInit() {
    super.finalInit();
    this.setGetMessageType("config/area_registry/list");
  }

  /**
   * @description Completes the setup process for the HomeAssistantAreas instance.
   * @category Setup
   */
  completeSetup () {
    super.completeSetup();
    
    const root = this.homeAssistant().rootFolder();
    root.removeAllSubnodes();
    root.addSubnodes(this.haObjects());
  }

}.initThisClass());