/**
 * @module library.services.Spatial
 */

/**
 * @class HomeAssistants
 * @extends BMSummaryNode
 * @classdesc Represents a collection of home assistants.
 */
(class HomeAssistants extends BMSummaryNode {

  /**
   * @description Initializes the prototype slots for the HomeAssistants class.
   */
  initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes that can be added to this node.
     */
    this.setSubnodeClasses([HomeAssistant]);

    /**
     * @member {string} title - The title of the HomeAssistants node.
     */
    this.setTitle("Home Assistants");

    /**
     * @member {boolean} shouldStore - Indicates whether this node should be stored.
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether subnodes of this node should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether subnodes can be added to this node.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether subnodes of this node can be reordered.
     */
    this.setNodeCanReorderSubnodes(true);
  }

}.initThisClass());