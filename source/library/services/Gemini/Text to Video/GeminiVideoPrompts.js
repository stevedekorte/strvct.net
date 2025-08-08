/**
  * @module library.services.Gemini.Text_to_Video
  */

/**
  * @class GeminiVideoPrompts
  * @extends SvSummaryNode
  * @classdesc Represents a collection of Gemini video prompts for text-to-video conversion.
  */
(class GeminiVideoPrompts extends SvSummaryNode {
    
    /**
      * Initializes the prototype slots for the OpenAiImagePrompts class.
      * @description Sets up the storage, subnode classes, and other properties for the OpenAiImagePrompts node.
      * @category Initialization
      */
    initPrototypeSlots () {

    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setSubnodeClasses([GeminiVideoPrompt]);
        this.setNodeCanAddSubnode(true);
        this.setNodeCanReorderSubnodes(false);
        this.setTitle("Text to Video");
        this.setNoteIsSubnodeCount(true);
    }

    finalInit () {
        super.finalInit();
        this.initPrototype();
    }


    /**
      * Returns the parent service node.
      * @description Retrieves the parent node, which is expected to be the service node.
      * @returns {Object} The parent service node.
      * @category Node Relationships
      */
    service () {
        return this.ownerNode();
    }

}.initThisClass());