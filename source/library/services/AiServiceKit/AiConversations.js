/**
* @module library.services.AiServiceKit
*/

/**
* @class AiConversations
* @extends SvSummaryNode
* @classdesc Manages AI conversations.
* 
* conversations
* - conversation
* - - requests
* - - - request, response
*/
(class AiConversations extends SvSummaryNode {
    /**
    * @description Initializes prototype slots for the class.
    * @category Initialization
    */
    initPrototypeSlots () {
    }
        

    /**
    * @description Initializes the AiConversations instance.
    * @category Initialization
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
    * @category Initialization
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
    * @category UI Behavior
    */
    subviewsScrollSticksToBottom () {
    return false;
    }

    /**
    * @description Gets the parent service.
    * @returns {Object} The parent node, which is assumed to be the service.
    * @category Service Management
    */
    service () {
    return this.parentNode();
    }

}.initThisClass());