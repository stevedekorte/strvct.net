/**
 * @module library.services.HomeAssistant
 */

/**
 * @class HomeAssistantGroup
 * @extends SvSummaryNode
 * @classdesc Represents a group of Home Assistant devices or entities.
 */
(class HomeAssistantGroup extends SvSummaryNode {

  /**
   * @description Initializes the prototype slots for the HomeAssistantGroup.
   * @category Initialization
   */
  initPrototypeSlots () {
    /**
     * @member {HomeAssistant} homeAssistant - The Home Assistant instance.
     * @category Configuration
     */
    {
      const slot = this.newSlot("homeAssistant", null);
      slot.setSlotType("HomeAssistant");
    }

    /**
     * @member {String} getMessageType - The message type for retrieving data.
     * @category Configuration
     */
    {
      const slot = this.newSlot("getMessageType", null);
      slot.setSlotType("String");
    }

    /**
     * @member {Map} idMap - A map to store objects by their IDs.
     * @category Data Management
     */
    {
      const slot = this.newSlot("idMap", null);
      slot.setSlotType("Map");
    }

    this.setTitle("devices");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    //this.setSubnodeClasses([HomeAssistantDevice]);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * @description Initializes the HomeAssistantGroup instance.
   * @category Initialization
   */
  init () {
    super.init();
    this.setIdMap(new Map());
  }

  /**
   * @description Performs final initialization steps.
   * @category Initialization
   */
  finalInit () {
    super.finalInit();
    this.makeSortSubnodesByTitle();
  }

  /**
   * @description Retrieves an object by its ID.
   * @param {string} id - The ID of the object to retrieve.
   * @returns {Object} The object with the specified ID.
   * @category Data Retrieval
   */
  objectWithId (id) {
    return this.idMap().get(id);
  }

  /**
   * @description Returns the default subnode class.
   * @returns {Function} The default subnode class.
   * @category Configuration
   */
  defaultSubnodeClass () {
    return this.subnodeClasses().first();
  }

  /**
   * @description Returns the name of the group.
   * @returns {string} The name of the group.
   * @category Data Retrieval
   */
  groupName () {
    return this.svType().after("HomeAssistant");
  }

  /**
   * @description Asynchronously refreshes the group's data.
   * @returns {Promise<void>}
   * @category Data Management
   */
  async asyncRefresh () {
    this.removeAllSubnodes();

    const s = "refreshing " + this.groupName() + "s...";
    console.log(s);
    this.homeAssistant().setStatus(s);

    const json = await this.homeAssistant().asyncSendMessageDict({ type: this.getMessageType() });
    this.setHaJson(json);
    this.connectObjects();
    //this.completeSetup();
  }

  /**
   * @description Sets the Home Assistant JSON data and creates subnodes.
   * @param {Object[]} json - The JSON data from Home Assistant.
   * @returns {HomeAssistantGroup} The current instance.
   * @category Data Management
   */
  setHaJson (json) {
    this.removeAllSubnodes();
    json.forEach(snJson => {
      const node = this.defaultSubnodeClass().clone();
      node.setHaJson(snJson);
      node.setGroup(this);
      this.idMap().set(node.id(), node);
      this.addLinkSubnode(node);
    });
    return this;
  }

  /**
   * @description Returns an array of all Home Assistant objects in the group.
   * @returns {Object[]} An array of Home Assistant objects.
   * @category Data Retrieval
   */
  haObjects () {
    return this.idMap().valuesArray();
  }

  /**
   * @description Connects all objects in the group.
   * @returns {HomeAssistantGroup} The current instance.
   * @category Data Management
   */
  connectObjects () {
    this.haObjects().shallowCopy().forEach(sn => sn.connectObjects());
    return this;
  }

  /**
   * @description Completes the setup for all objects in the group.
   * @returns {HomeAssistantGroup} The current instance.
   * @category Initialization
   */
  completeSetup () {
    this.haObjects().shallowCopy().forEach(sn => sn.completeSetup());
    return this;
  }

  /**
   * @description Retrieves a subnode by its ID.
   * @param {string} id - The ID of the subnode to retrieve.
   * @throws {Error} Always throws an error as this method should not be used.
   * @category Data Retrieval
   */
  subnodeWithId (id) {
    throw new Error("shouldn't use this");
    //const ids = this.subnodes().map(sn => sn.id());
    return this.subnodes().detect(sn => sn.id() === id);
  }

}.initThisClass());