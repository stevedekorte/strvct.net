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
     * @property {Array} subnodeClasses - The classes of subnodes that can be added to this node.
     */
    this.setSubnodeClasses([HomeAssistant]);

    /**
     * @property {string} title - The title of the HomeAssistants node.
     */
    this.setTitle("Home Assistants");

    /**
     * @property {boolean} shouldStore - Indicates whether this node should be stored.
     */
    this.setShouldStore(true);

    /**
     * @property {boolean} shouldStoreSubnodes - Indicates whether subnodes of this node should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @property {boolean} nodeCanAddSubnode - Indicates whether subnodes can be added to this node.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @property {boolean} nodeCanReorderSubnodes - Indicates whether subnodes of this node can be reordered.
     */
    this.setNodeCanReorderSubnodes(true);
  }

}.initThisClass());