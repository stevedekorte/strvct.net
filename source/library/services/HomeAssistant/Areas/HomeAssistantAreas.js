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
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the HomeAssistantAreas instance.
   */
  init() {
    super.init();
    this.setTitle("areas");
    this.setSubnodeClasses([HomeAssistantArea]);
  }

  /**
   * @description Performs final initialization steps.
   */
  finalInit() {
    super.finalInit();
    this.setGetMessageType("config/area_registry/list");
  }

  /**
   * @description Completes the setup process for the HomeAssistantAreas instance.
   */
  completeSetup () {
    super.completeSetup();
    
    const root = this.homeAssistant().rootFolder();
    root.removeAllSubnodes();
    root.addSubnodes(this.haObjects());
  }

}.initThisClass());