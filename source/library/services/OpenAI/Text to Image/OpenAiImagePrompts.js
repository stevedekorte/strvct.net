/**
 * @module library.services.OpenAI.Text_to_Image
 */

/**
 * @class OpenAiImagePrompts
 * @extends BMSummaryNode
 * @classdesc Represents a collection of OpenAI image prompts for text-to-image conversion.
 */
(class OpenAiImagePrompts extends BMSummaryNode {
  
  /**
   * Initializes the prototype slots for the OpenAiImagePrompts class.
   * @description Sets up the storage, subnode classes, and other properties for the OpenAiImagePrompts node.
   */
  initPrototypeSlots () {
    /**
     * @member {boolean} shouldStore - Indicates whether the node should be stored.
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Indicates whether subnodes should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {Array} subnodeClasses - The classes of subnodes that can be added to this node.
     */
    this.setSubnodeClasses([OpenAiImagePrompt]);

    /**
     * @member {boolean} nodeCanAddSubnode - Indicates whether subnodes can be added to this node.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Indicates whether subnodes can be reordered.
     */
    this.setNodeCanReorderSubnodes(true);

    /**
     * @member {string} title - The title of the node.
     */
    this.setTitle("Text to Image");

    /**
     * @member {boolean} noteIsSubnodeCount - Indicates whether the note should display the subnode count.
     */
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * Returns the parent service node.
   * @description Retrieves the parent node, which is expected to be the service node.
   * @returns {Object} The parent service node.
   */
  service () {
    return this.parentNode();
  }

}.initThisClass());