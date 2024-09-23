/**
 * @module library.services.AiServiceKit.AiConversations
 */

/**
 * @class AiConversations
 * @extends BMSummaryNode
 * @classdesc Manages AI conversations.
 * 
 * conversations
 * - conversation
 * - - requests
 * - - - request, response
 */
(class AiConversations extends BMSummaryNode {
  /**
   * @description Initializes prototype slots for the class.
   */
  initPrototypeSlots () {
  }

  /**
   * @description Initializes the AiConversations instance.
   */
  init() {
    super.init();
    this.setTitle("Conversations");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanAddSubnode(true);
    this.setNodeCanReorderSubnodes(true);
  }

  /**
   * @description Performs final initialization steps.
   */
  finalInit() {
    super.finalInit();
    this.setNoteIsSubnodeCount(true);

    // subclasses should set this
    this.setSubnodeClasses([AiConversation]);
  }

  /**
   * @description Determines if subviews scroll sticks to bottom.
   * @returns {boolean} False, indicating subviews do not stick to bottom when scrolling.
   */
  subviewsScrollSticksToBottom () {
    return false;
  }

  /**
   * @description Gets the parent service.
   * @returns {Object} The parent node, which is assumed to be the service.
   */
  service () {
    return this.parentNode();
  }

}.initThisClass());