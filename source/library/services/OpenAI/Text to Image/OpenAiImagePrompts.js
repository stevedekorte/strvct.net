/**
 * @module library.services.OpenAI.Text_to_Image
 */

/**
 * @class OpenAiImagePrompts
 * @extends SvSummaryNode
 * @classdesc Represents a collection of OpenAI image prompts for text-to-image conversion.
 */
(class OpenAiImagePrompts extends SvSummaryNode {

    /**
   * Initializes the prototype slots for the OpenAiImagePrompts class.
   * @description Sets up the storage, subnode classes, and other properties for the OpenAiImagePrompts node.
   * @category Initialization
   */
    initPrototypeSlots () {
    /**
     * @member {boolean} shouldStore - Indicates whether the node should be stored.
     * @category Storage
     */
        this.setShouldStore(true);

        /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether subnodes should be stored.
     * @category Storage
     */
        this.setShouldStoreSubnodes(true);

        /**
     * @member {Array} subnodeClasses - The classes of subnodes that can be added to this node.
     * @category Node Structure
     */
        this.setSubnodeClasses([OpenAiImagePrompt]);

        /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether subnodes can be added to this node.
     * @category Node Structure
     */
        this.setNodeCanAddSubnode(true);

        /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether subnodes can be reordered.
     * @category Node Structure
     */
        this.setNodeCanReorderSubnodes(true);

        /**
     * @member {string} title - The title of the node.
     * @category Display
     */
        this.setTitle("Text to Image");

        /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note should display the subnode count.
     * @category Display
     */
        this.setNoteIsSubnodeCount(true);
    }

    /**
   * Returns the parent service node.
   * @description Retrieves the parent node, which is expected to be the service node.
   * @returns {Object} The parent service node.
   * @category Node Relationships
   */
    service () {
        return this.parentNode();
    }

}.initThisClass());
