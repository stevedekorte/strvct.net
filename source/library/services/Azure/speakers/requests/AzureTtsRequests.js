/**
 * @module library.services.Azure.speakers.requests.AzureTtsRequests
 */

/**
 * @class AzureTtsRequests
 * @extends BMSummaryNode
 * @classdesc Represents a collection of Azure TTS requests for a speaker.
 */
(class AzureTtsRequests extends BMSummaryNode {
  /**
   * Initializes the prototype slots for the class.
   * @method
   */
  initPrototypeSlots () {

  }

  /**
   * Initializes the instance.
   * @method
   * @description Sets up the initial state of the AzureTtsRequests instance.
   */
  init() {
    super.init();
    this.setTitle("requests");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setSubnodeClasses([AzureTtsRequest]);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
  }

  /**
   * Performs final initialization tasks.
   * @method
   * @description Sets additional properties after the main initialization.
   */
  finalInit() {
    super.finalInit()
    this.setNoteIsSubnodeCount(true);
    this.setTitle("requests");
  }

  /*
  didInit () {
    super.didInit()
  }
  */

  /**
   * Gets the parent speaker node.
   * @method
   * @returns {Object} The parent speaker node.
   */
  speaker () {
    return this.parentNode()
  }

}.initThisClass());