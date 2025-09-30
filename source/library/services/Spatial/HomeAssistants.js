/**
 * @module library.services.Spatial
 */

/**
 * @class HomeAssistants
 * @extends SvSummaryNode
 * @classdesc Represents a collection of home assistants.
 */
(class HomeAssistants extends SvSummaryNode {

    /**
   * @description Initializes the prototype slots for the HomeAssistants class.
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes that can be added to this node.
     * @category Configuration
     */
        this.setSubnodeClasses([HomeAssistant]);

        /**
     * @member {string} title - The title of the HomeAssistants node.
     * @category Display
     */
        this.setTitle("Home Assistants");

        /**
     * @member {boolean} shouldStore - Indicates whether this node should be stored.
     * @category Storage
     */
        this.setShouldStore(true);

        /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether subnodes of this node should be stored.
     * @category Storage
     */
        this.setShouldStoreSubnodes(true);

        /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether subnodes can be added to this node.
     * @category Node Management
     */
        this.setNodeCanAddSubnode(true);

        /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether subnodes of this node can be reordered.
     * @category Node Management
     */
        this.setNodeCanReorderSubnodes(true);
    }

}.initThisClass());
