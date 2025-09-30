/**
  * @module library.services.AiServiceKit
  */

/**
  * @class AiChatModels
  * @extends SvSummaryNode
  * @classdesc Represents a collection of AI chat models.
  */
(class AiChatModels extends SvSummaryNode {
    /**
      * @description Initializes prototype slots for the class.
      * @category Initialization
      */
    initPrototypeSlots () {
    }

    /**
      * @description Initializes the instance.
      * @category Initialization
      */
    init () {
        super.init();
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(true);
    }

    /**
      * @description Performs final initialization tasks.
      * @category Initialization
      */
    finalInit () {
        super.finalInit();
        this.setNoteIsSubnodeCount(true);
        this.setSubnodeClasses([AiChatModel]);
        this.setNodeSubtitleIsChildrenSummary(true);
        this.setTitle("Models");
        this.setNodeCanAddSubnode(false);
    }

    /**
      * @description Determines if subviews scroll sticks to bottom.
      * @returns {boolean} False, indicating subviews scroll does not stick to bottom.
      * @category UI
      */
    subviewsScrollSticksToBottom () {
        return false;
    }

    /**
      * @description Gets the parent service.
      * @returns {Object} The parent node, which is assumed to be the service.
      * @category Data Access
      */
    service () {
        return this.parentNode();
    }

    justRemoveSubnode (aSubnode) {
        super.justRemoveSubnode(aSubnode);
    }

    subtitle () {
        if (this.subnodes().length === 0) {
            return "no models";
        }
        return super.subtitle();
    }

}.initThisClass());