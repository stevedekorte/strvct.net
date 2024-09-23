/**
 * @module library.services.HomeAssistant.Entities
 */

/**
 * @class HomeAssistantEntities
 * @extends HomeAssistantGroup
 * @classdesc Represents a collection of Home Assistant entities.
 */
(class HomeAssistantEntities extends HomeAssistantGroup {
  /**
   * @description Initializes the prototype slots for the class.
   */
  initPrototypeSlots () {

  }

  /**
   * @description Initializes the HomeAssistantEntities instance.
   */
  init() {
    super.init();
    this.setTitle("entities");
    this.setSubnodeClasses([HomeAssistantEntity]);
  }

  /**
   * @description Performs final initialization steps for the HomeAssistantEntities instance.
   */
  finalInit() {
    super.finalInit();
    this.setGetMessageType("config/entity_registry/list");
  }

}.initThisClass());